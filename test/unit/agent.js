'use strict';

const assert = require('assert');
const agent = require('../../lib/agent');

describe('HTTP agent', function () {
  it('Without proxy', function () {
    assert.strictEqual(null, agent());
  });

  it('HTTPS proxy with auth from HTTPS_PROXY', function () {
    process.env.HTTPS_PROXY = 'https://user:pass@secure:123';
    const proxy = agent();
    delete process.env.HTTPS_PROXY;
    assert.strictEqual('object', typeof proxy);
    assert.strictEqual('secure', proxy.options.proxy.host);
    assert.strictEqual(123, proxy.options.proxy.port);
    assert.strictEqual('user:pass', proxy.options.proxy.proxyAuth);
    assert.strictEqual(443, proxy.defaultPort);
  });

  it('HTTPS proxy with auth from HTTPS_PROXY using credentials containing special characters', function () {
    process.env.HTTPS_PROXY = 'https://user,:pass=@secure:123';
    const proxy = agent();
    delete process.env.HTTPS_PROXY;
    assert.strictEqual('object', typeof proxy);
    assert.strictEqual('secure', proxy.options.proxy.host);
    assert.strictEqual(123, proxy.options.proxy.port);
    assert.strictEqual('user,:pass=', proxy.options.proxy.proxyAuth);
    assert.strictEqual(443, proxy.defaultPort);
  });

  it('HTTP proxy without auth from npm_config_proxy', function () {
    process.env.npm_config_proxy = 'http://plaintext:456';
    const proxy = agent();
    delete process.env.npm_config_proxy;
    assert.strictEqual('object', typeof proxy);
    assert.strictEqual('plaintext', proxy.options.proxy.host);
    assert.strictEqual(456, proxy.options.proxy.port);
    assert.strictEqual(null, proxy.options.proxy.proxyAuth);
    assert.strictEqual(443, proxy.defaultPort);
  });
});
