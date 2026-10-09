import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseIpLocation } from '../src/lib/ip-location.ts';

test('正常返回：国家 + 城市，并带上经纬度', () => {
  const parsed = parseIpLocation({
    success: true,
    country: 'China',
    region: 'Beijing',
    city: 'Beijing',
    latitude: 39.9074752,
    longitude: 116.3972298,
  });

  // region 和 city 常常是同一个词，拼出来只能出现一次
  assert.equal(parsed.label, 'China Beijing');
  assert.deepEqual(parsed.coords, { latitude: 39.9074752, longitude: 116.3972298 });
});

test('没认出来（success=false）就回空 label，交给调用方显示「地球」', () => {
  assert.deepEqual(parseIpLocation({ success: false, message: 'Reserved range' }), {
    label: '',
    coords: null,
  });
});

test('缺经纬度时只给地名，坐标是 null（没坐标就不编天气）', () => {
  const parsed = parseIpLocation({ success: true, country: 'Japan', region: 'Tokyo' });

  // 没有 city 才退到 region
  assert.equal(parsed.label, 'Japan Tokyo');
  assert.equal(parsed.coords, null);
});

test('国家和城市同名不重复，脏数据不崩也不瞎认坐标', () => {
  assert.equal(parseIpLocation({ success: true, country: 'Singapore', city: 'Singapore' }).label, 'Singapore');
  assert.equal(parseIpLocation({ success: true, country: '', city: '' }).label, '');
  assert.deepEqual(parseIpLocation(null), { label: '', coords: null });
  // 字符串形式的经纬度（有的接口会这么给）不算坐标
  assert.deepEqual(parseIpLocation({ success: true, latitude: '39.9', longitude: 116.4 }), {
    label: '',
    coords: null,
  });
});
