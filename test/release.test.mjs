import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

test('release gate catches a staged secret after the working copy is cleaned',()=>{
  const tempRoot=os.tmpdir();const dir=mkdtempSync(path.join(tempRoot,'twofold-release-test-'));
  try {
    mkdirSync(path.join(dir,'scripts'));mkdirSync(path.join(dir,'dist'));
    copyFileSync(new URL('../scripts/check-release.mjs',import.meta.url),path.join(dir,'scripts/check-release.mjs'));
    writeFileSync(path.join(dir,'dist/index.html'),'<p>Clean bundle</p>');
    execFileSync('git',['init','-q'],{cwd:dir});
    const canary=['sk','proj',Array(40).fill('Q').join('')].join('-');
    writeFileSync(path.join(dir,'notes.txt'),canary);
    execFileSync('git',['add','notes.txt'],{cwd:dir});
    writeFileSync(path.join(dir,'notes.txt'),'Clean working copy');
    const checked=spawnSync(process.execPath,['scripts/check-release.mjs'],{cwd:dir,encoding:'utf8',env:{...process.env,OPENAI_API_KEY:''}});
    assert.equal(checked.status,1);assert.match(checked.stderr,/notes.txt \(staged\)/);assert.equal(checked.stderr.includes(canary),false);
    execFileSync('git',['add','notes.txt'],{cwd:dir});
    const clean=spawnSync(process.execPath,['scripts/check-release.mjs'],{cwd:dir,encoding:'utf8',env:{...process.env,OPENAI_API_KEY:''}});
    assert.equal(clean.status,0,clean.stderr);assert.match(clean.stdout,/"passed":true/);
  } finally {
    const resolved=path.resolve(dir), boundary=path.resolve(tempRoot)+path.sep;
    if(!resolved.startsWith(boundary)||!path.basename(resolved).startsWith('twofold-release-test-'))throw new Error('Unexpected test cleanup path');
    rmSync(resolved,{recursive:true,force:true});
  }
});
