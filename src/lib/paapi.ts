import crypto from "crypto";

function sha256Hex(data: string) { return crypto.createHash("sha256").update(data,"utf8").digest("hex"); }
function hmac(key: Buffer | string, data: string) { return crypto.createHmac("sha256", key).update(data,"utf8").digest(); }
function hmacHex(key: Buffer | string, data: string) { return crypto.createHmac("sha256", key).update(data,"utf8").digest("hex"); }

export async function paapiSearchItems(opts: {
  keywords: string; partnerTag: string; accessKey: string; secretKey: string;
  host: string; region: string; marketplace: string;
}) {
  const method = "POST";
  const service = "ProductAdvertisingAPI";
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
  const path = "/paapi5/searchitems";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g,"").slice(0,15)+"Z";
  const dateStamp = amzDate.slice(0,8);

  const body = {
    PartnerTag: opts.partnerTag,
    PartnerType: "Associates",
    Keywords: opts.keywords,
    Marketplace: opts.marketplace,
    SearchIndex: "All",
    ItemPage: 1,
    Resources: ["ItemInfo.Title","ItemInfo.ByLineInfo","Offers.Listings.Price","Images.Primary.Medium"]
  };
  const payload = JSON.stringify(body);
  const headers = {
    "content-encoding":"amz-1.0",
    "content-type":"application/json; charset=UTF-8",
    "host":opts.host,
    "x-amz-date":amzDate,
    "x-amz-target":target
  };
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalHeaders =
    `content-encoding:${headers["content-encoding"]}\n`+
    `content-type:${headers["content-type"]}\n`+
    `host:${headers["host"]}\n`+
    `x-amz-date:${headers["x-amz-date"]}\n`+
    `x-amz-target:${headers["x-amz-target"]}\n`;

  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256Hex(payload)}`;
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${opts.region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;
  const kDate = hmac("AWS4"+opts.secretKey, dateStamp);
  const kRegion = hmac(kDate, opts.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmacHex(kSigning, stringToSign);
  const authorization = `${algorithm} Credential=${opts.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${opts.host}${path}`, {
    method,
    headers: { ...headers, Authorization: authorization },
    body: payload,
    // @ts-ignore
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PA-API HTTP ${res.status}: ${await res.text().catch(()=> "")}`);
  return res.json();
}

export function pickBestItem(items: any[], brandHint?: string, mustContain?: string[]) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;
  const brandLC = (brandHint||"").toLowerCase();
  const score = (it: any) => {
    let s = 0;
    const b = String(it?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue||"").toLowerCase();
    const t = String(it?.ItemInfo?.Title?.DisplayValue||"").toLowerCase();
    if (brandLC && b.includes(brandLC)) s += 2;
    (mustContain||[]).forEach(tok => { if (t.includes(tok)) s += 1; });
    return s;
  };
  return arr.map(x=>({x, s:score(x)})).sort((a,b)=>b.s-a.s)[0]?.x || arr[0];
}
