const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const PORT = 5500;

// TapDB 配置
const TAPDB_CLIENT_ID = 'mrntcrkwywwcdpschb';
const TAPDB_ENDPOINT = 'e.tapdb.net';
const TAPDB_SINGLE_PATH = '/v2/event';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

// 收集 POST 请求体
function collectBody(req) {
  return new Promise((resolve, reject) => {
    var chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() {
      try {
        var body = Buffer.concat(chunks).toString('utf8');
        resolve(body ? JSON.parse(body) : null);
      } catch(e) {
        reject(new Error('JSON parse error'));
      }
    });
    req.on('error', reject);
  });
}

// 转发数据到 TapDB REST API
function forwardToTapDB(payload) {
  return new Promise((resolve, reject) => {
    var body = JSON.stringify(payload);
    var options = {
      hostname: TAPDB_ENDPOINT,
      path: TAPDB_SINGLE_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(options, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var reply = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body: reply });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

http.createServer(function(req, res) {
  var urlPath = decodeURIComponent(req.url.split('?')[0]);

  // CORS headers for all responses
  function sendJson(status, data) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(200, { ok: true });
    return;
  }

  // TapDB 事件跟踪代理
  if (urlPath === '/api/track' && req.method === 'POST') {
    collectBody(req).then(function(body) {
      if (!body || !body.type || !body.name) {
        sendJson(400, { error: 'missing required fields: type, name' });
        return;
      }
      body.client_id = TAPDB_CLIENT_ID;
      // 添加 sdk_version
      if (!body.properties) body.properties = {};
      if (!body.properties.sdk_version) body.properties.sdk_version = '2.8.0';
      if (!body.properties.app_version) body.properties.app_version = '1.0';

      console.log('[TapDB] Track event:', body.name);
      return forwardToTapDB(body).then(function(result) {
        console.log('[TapDB] Response:', result.status, result.body);
        if (result.status === 200) {
          sendJson(200, { ok: true });
        } else {
          sendJson(result.status, { error: 'TapDB error', detail: result.body });
        }
      });
    }).catch(function(err) {
      console.error('[TapDB] Error:', err.message);
      sendJson(400, { error: err.message });
    });
    return;
  }

  // 批量跟踪代理
  if (urlPath === '/api/batch' && req.method === 'POST') {
    collectBody(req).then(function(body) {
      if (!body || !body.data || !Array.isArray(body.data)) {
        sendJson(400, { error: 'missing required field: data' });
        return;
      }
      body.data.forEach(function(ev) {
        ev.client_id = TAPDB_CLIENT_ID;
        if (!ev.properties) ev.properties = {};
        if (!ev.properties.sdk_version) ev.properties.sdk_version = '2.8.0';
        if (!ev.properties.app_version) ev.properties.app_version = '1.0';
      });
      console.log('[TapDB] Batch events:', body.data.length);
      forwardToTapDB(body).then(function(result) {
        console.log('[TapDB] Batch response:', result.status, result.body);
        if (result.status === 200) {
          sendJson(200, { ok: true });
        } else {
          sendJson(result.status, { error: 'TapDB error', detail: result.body });
        }
      }).catch(function(err) {
        console.error('[TapDB] Batch error:', err.message);
        sendJson(400, { error: err.message });
      });
    }).catch(function(err) {
      sendJson(400, { error: err.message });
    });
    return;
  }

  // 静态文件服务：游戏本体在index.html（H5部署平台首页强制要求）
  if (urlPath === '/') urlPath = '/index.html';
  var filePath = path.join(ROOT, urlPath);

  fs.readFile(filePath, function(err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + urlPath);
      return;
    }
    var ext = path.extname(filePath).toLowerCase();
    var mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', function() {
  console.log('Server running at http://0.0.0.0:' + PORT);
  console.log('Local:   http://localhost:' + PORT);
  console.log('Network: http://192.168.100.100:' + PORT);
  console.log('TapDB proxy enabled, Client ID:', TAPDB_CLIENT_ID);
});
