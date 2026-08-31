import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDirectory = path.join(root, "public", "bridge-editorial");
const manifestPath = path.join(assetDirectory, "ALIGN-IMAGE-PROVENANCE.json");

const visualContract = "Bridge editorial documentary realism using the Align HCM Image Gen composition discipline: tactile detail, asymmetric framing, directional light, crisp professional color grade, and a separate web grain treatment. Adapted to Bridge's verified Connected identity with deep aubergine, near-black, restrained violet practical light, subtle coral structure, and warm neutral highlights. No text, logos, watermarks, visible consumption, smoke, glossy rendering, or stock-photo posing.";

const sheets = [
  { id: "sheet-01", prompt: "Oregon edible wholesale presentation; Michigan retail shelf planning; California cultivation and genetics inspection; Maryland professional education event.", assets: ["community-oregon-edibles.webp", "community-michigan-retail.webp", "community-california-cultivation.webp", "community-maryland-education.webp"] },
  { id: "sheet-02", prompt: "New Jersey wellness wholesale review; Michigan licensed transport planning; Ohio facility climate-control service; Michigan analytical sample intake.", assets: ["community-new-jersey-wellness.webp", "community-michigan-logistics.webp", "community-ohio-facility.webp", "community-michigan-testing.webp"] },
  { id: "sheet-03", prompt: "Flower and genetics detail; pre-roll and vapor hardware assortment; edible and wellness textures; testing and compliance laboratory.", assets: ["category-flower-genetics.webp", "category-prerolls-vapes.webp", "category-edibles-wellness.webp", "category-testing-compliance.webp"] },
  { id: "sheet-04", prompt: "Cannabis industry services coordination; Cascade Canna edible production; Harbor Dispensary buyer handoff; Northstar territory planning.", assets: ["category-industry-services.webp", "profile-cascade-canna.webp", "profile-harbor-dispensary.webp", "profile-northstar-sales.webp"] },
  { id: "sheet-05", prompt: "Mosaic Market merchandising; Greenline Goods wellness studio; Presque Isle patient education; Steel City concentrate production.", assets: ["profile-mosaic-market.webp", "profile-greenline-goods.webp", "profile-presque-isle-wellness.webp", "profile-steel-city-botanicals.webp"] },
  { id: "sheet-06", prompt: "Front Range territory planning; Motor City buying team; Union Street local supply partnership; Golden State genetics selection.", assets: ["profile-front-range-reps.webp", "profile-motor-city-supply.webp", "profile-union-street.webp", "profile-golden-state-genetics.webp"] },
  { id: "sheet-07", prompt: "Great Lakes analytical laboratory; Purple Route licensed transport; Canopy Capital treasury advisory; Root Zone hydroponics calibration.", assets: ["profile-great-lakes-analytics.webp", "profile-purple-route-logistics.webp", "profile-canopy-capital-services.webp", "profile-root-zone-hydro.webp"] },
  { id: "sheet-08", prompt: "Evergreen facility systems; Lake Effect compliant manufacturing; Signal Desk operator interview; professional nationwide industry gathering.", assets: ["profile-evergreen-facility-group.webp", "profile-lake-effect-manufacturing.webp", "profile-signal-desk-media.webp", "home-community-network.webp"] },
  { id: "sheet-09", prompt: "Nationwide market discovery; verified business introduction; promotion creator workflow; public-versus-protected profile review.", assets: ["home-nationwide-markets.webp", "home-verified-identity.webp", "create-promotion-studio.webp", "profile-protected-details.webp"] },
  { id: "sheet-10", prompt: "Community category thumbnails for edibles, retail, cultivation, and professional education events.", assets: ["community-category-edibles.webp", "community-category-retail.webp", "community-category-cultivation.webp", "community-category-events.webp"] },
  { id: "sheet-11", prompt: "Community category thumbnails for wellness, secure transport, facility services, and analytical testing.", assets: ["community-category-wellness.webp", "community-category-transport.webp", "community-category-services.webp", "community-category-testing.webp"] },
];

const promptByAsset = new Map(sheets.flatMap((sheet) => sheet.assets.map((asset) => [asset, sheet.id])));

function routeFor(file) {
  if (file.startsWith("community-")) return "/community";
  if (file.startsWith("category-")) return "/explore";
  if (file.startsWith("profile-") && file !== "profile-protected-details.webp") return "/explore and /profile/[slug]";
  if (file.startsWith("home-")) return "/";
  if (file.startsWith("create-")) return "/create";
  return "/my-profile";
}

const files = (await readdir(assetDirectory)).filter((file) => file.endsWith(".webp")).sort();
const assets = [];
for (const file of files) {
  const bytes = await readFile(path.join(assetDirectory, file));
  assets.push({
    file,
    publicPath: `/bridge-editorial/${file}`,
    businessRoute: "bridge-software",
    appRoute: routeFor(file),
    slot: file.replace(/\.webp$/, ""),
    promptId: promptByAsset.get(file),
    model: "OpenAI image_gen tool",
    sourceDimensions: "1536x1024 contact sheet",
    dimensions: "760x504",
    format: "WebP",
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  businessRoute: "bridge-software",
  visualContract,
  intentionalReuseExceptions: ["/bridge-mark.svg"],
  sheets,
  assets,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ manifest: path.relative(root, manifestPath), assets: assets.length, uniqueHashes: new Set(assets.map((asset) => asset.sha256)).size }));
