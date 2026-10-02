export function publicUrl(input) {
  let url;try{url=new URL(input);}catch{throw new Error('Enter a complete public https:// website address.');}
  if(url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443')) throw new Error('Only public HTTPS pages are supported.');
  const host=url.hostname.toLowerCase();
  if(!host.includes('.') || host.endsWith('.') || host==='localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host.startsWith('[') || /^[\d.]+$/.test(host)) throw new Error('Use a public website hostname.');
  url.hash='';return url;
}
export function isPublicIP(address) {
  if(address.includes(':')) return false; // Request only IPv4; deny all IPv6 and mapped addresses.
  const a=address.split('.').map(Number);if(a.length!==4||a.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
  return !(a[0]===0||a[0]===10||a[0]===127||a[0]>=224||(a[0]===169&&a[1]===254)||(a[0]===172&&a[1]>=16&&a[1]<=31)||(a[0]===192&&a[1]===168)||(a[0]===100&&a[1]>=64&&a[1]<=127)||(a[0]===198&&(a[1]===18||a[1]===19))||(a[0]===192&&a[1]===0));
}
export async function readLimited(response,limit=3000000) { if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel().catch(()=>{});throw new Error('This page is too large to import.');}const reader=response.body.getReader();const chunks=[];let size=0;try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new Error('This page is too large to import.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return new TextDecoder().decode(bytes);}
