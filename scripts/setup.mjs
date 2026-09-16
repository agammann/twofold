import { existsSync, lstatSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { execFileSync } from 'node:child_process';

const target = fileURLToPath(new URL('../.env.local',import.meta.url));
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Run npm run setup in an interactive terminal. The key is entered privately and never echoed.');
  process.exit(1);
}
if (existsSync(target) && (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink())) {
  console.error('Refusing to write to a symlink or nonregular .env.local.'); process.exit(1);
}
let current=existsSync(target)?readFileSync(target,'utf8'):'';
if (/^\s*OPENAI_API_KEY\s*=/m.test(current)) {
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  const answer=await rl.question('A local API key is already configured. Replace it? (y/N) ');rl.close();
  if (answer.trim().toLowerCase()!=='y') {console.log('Kept the existing configuration.');process.exit(0);}
}
console.log('Create a project API key at https://platform.openai.com/api-keys. API billing is separate from ChatGPT.');
process.stdout.write('Paste your OpenAI key (hidden), then press Enter: ');
const secret=await new Promise(resolve=>{
  let value='';process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
  const done=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value.trim());};
  const onData=chunk=>{for(const ch of chunk){if(ch==='\u0003'){process.stdin.setRawMode(false);process.stdout.write('\nCanceled.\n');process.exit(1);}if(ch==='\r'||ch==='\n'){done();return;}if(ch==='\u007f'||ch==='\b')value=value.slice(0,-1);else if(ch>=' ')value+=ch;}};
  process.stdin.on('data',onData);
});
if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(secret)) {console.error('That does not look like an OpenAI API key. Nothing was saved.');process.exit(1);}
// Create only an empty file before securing its permissions. No new secret is
// written if permission setup fails. Existing keys are not replaced until then.
if (!existsSync(target)) writeFileSync(target,'',{flag:'wx',mode:0o600});
if (process.platform === 'win32') {
  try {
    execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',[
      "$ErrorActionPreference = 'Stop'",
      '$target = $env:TWOFOLD_KEY_PATH',
      '$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User',
      "$allowed = @($sid.Value, 'S-1-5-18', 'S-1-5-32-544')",
      '$acl = [System.Security.AccessControl.FileSecurity]::new()',
      '$acl.SetAccessRuleProtection($true, $false)',
      'foreach ($id in $allowed) { $principal = [System.Security.Principal.SecurityIdentifier]::new($id); $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($principal, [System.Security.AccessControl.FileSystemRights]::FullControl, [System.Security.AccessControl.AccessControlType]::Allow); $acl.AddAccessRule($rule) }',
      '[System.IO.File]::SetAccessControl($target, $acl)',
      '$actual = [System.IO.File]::GetAccessControl($target)',
      "if (-not $actual.AreAccessRulesProtected) { throw 'Inheritance is enabled' }",
      "foreach ($entry in $actual.Access) { if ($entry.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -notin $allowed) { throw 'Unexpected file permission' } }",
    ].join('; ')],{stdio:'ignore',windowsHide:true,env:{...process.env,TWOFOLD_KEY_PATH:target}});
  } catch {
    console.error('Windows file permissions could not be restricted. The new key was not saved. Check file Properties > Security and try again.');
    process.exit(1);
  }
} else chmodSync(target,0o600);
current=current.replace(/^\s*OPENAI_API_KEY\s*=.*(?:\r?\n|$)/gm,'');
writeFileSync(target,`${current.trimEnd()}\nOPENAI_API_KEY=${secret}\n`,{mode:0o600});
console.log('Saved OPENAI_API_KEY to .env.local. The file is excluded from Git. Restart Twofold to use it.');
