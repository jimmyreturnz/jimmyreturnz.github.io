// node --experimental-strip-types src/rules.test.ts
import assert from 'node:assert/strict';
import { checkMessage, checkLink } from './rules.ts';

const ok = (name: string, message: string) => checkMessage({ name, message });
assert.deepEqual(ok('  Jimmy  ', ' hi! '), { ok: true, name: 'Jimmy', body: 'hi!' });
assert.equal(ok('น้องเจ', 'สวัสดีครับ ชอบเว็บมาก').ok, true);
assert.equal(ok('ねこ', 'すごい！').ok, true);
assert.equal(ok('a', 'ก'.repeat(1000)).ok, true);         // 1000 Thai characters is fine
assert.equal(ok('a', 'ก'.repeat(1001)).ok, false);
assert.equal(ok('a', '😀'.repeat(1000)).ok, true);         // emoji count as one character each
assert.equal(ok('', 'hi').ok, false);
assert.equal(ok('a', '   ').ok, false);
assert.equal(ok('a'.repeat(41), 'hi').ok, false);
for (const bad of ['see https://x.y', 'go to www.site', 'mysite.com', 'mysite . com', 'discord.gg/abc', 'HTTP://A.B'])
  assert.equal(ok('a', bad).ok, false, bad);
assert.equal(ok('spam.com', 'hi').ok, false);
assert.equal(ok('a', 'gg wp, 1.5 stars lol').ok, true);   // ordinary dots are fine
assert.deepEqual(ok('a', 'hi\u202ethere'), { ok: true, name: 'a', body: 'hithere' }); // direction tricks removed

assert.equal(checkLink(''), null);
assert.equal(checkLink('https://osu.ppy.sh/users/1'), 'https://osu.ppy.sh/users/1');
assert.equal(checkLink('http://osu.ppy.sh'), false);
assert.equal(checkLink('javascript:alert(1)'), false);
assert.equal(checkLink('https://user:pw@x.com'), false);
console.log('rules ok');
