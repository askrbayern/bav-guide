import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFile(path.join(root, name), 'utf8');
const json = async name => JSON.parse(await read(`data/${name}.json`));
const [html, manifest, techniques, evidence, references, cohorts, observations] = await Promise.all([
  read('index.html'), json('manifest'), json('techniques'), json('evidence'),
  json('references'), json('cohorts'), json('observations')
]);
const datasets = { techniques, evidence, references, cohorts, observations };
for (const [name, rows] of Object.entries(datasets)) {
  assert.equal(rows.length, manifest.datasets[name].rows);
  assert.ok((await read(`data/${name}.csv`)).startsWith('\ufeff'));
}
const sourceIDs = new Set(references.map(r => r.source_id));
const cohortIDs = new Set(cohorts.map(r => r.cohort_id));
for (const rows of [techniques, evidence, cohorts, observations]) {
  for (const row of rows) {
    if (row.source_id) assert.ok(sourceIDs.has(row.source_id));
    if (row.source_url) assert.equal(new URL(row.source_url).protocol, 'https:');
    assert.equal(row.evidence_snapshot_date, manifest.evidence_snapshot_date);
  }
}
for (const row of observations) {
  assert.ok(cohortIDs.has(row.cohort_id));
  assert.ok(Number.isInteger(row.numerator) && row.numerator >= 0);
  assert.ok(Number.isInteger(row.denominator) && row.denominator > 0);
  assert.ok(row.numerator <= row.denominator);
  assert.ok(row.denominator_population && row.time_window && row.limitation);
}
for (const name of ['index.html', 'data.html']) {
  const document = await read(name);
  const ids = [...document.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, `Unique IDs in ${name}`);
  for (const [, url] of document.matchAll(/\bhref="([^"]+)"/g)) {
    if (url.startsWith('#')) assert.ok(ids.includes(url.slice(1)), `Anchor ${url}`);
    else if (!url.startsWith('https://')) {
      assert.ok(!url.includes('..') && !url.startsWith('/'));
      await fs.access(path.join(root, url));
    }
  }
}

const app = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const imports = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
assert.equal(Object.keys(imports).length, 2);
assert.ok(Object.values(imports).every(url => url.startsWith('data:text/javascript;base64,')));
const THREE = await import(imports.three);
const code = app.slice(0, app.indexOf('\ntry{')).replace(/^import .*?;\n/gm, '');
const context = vm.createContext({ THREE, document: { getElementById: () => ({}) } });
new vm.Script(code + `
  colors = Object.fromEntries(['fused','nonfused','repair','graft','patch','edge','wall']
    .map((key, i) => [key, new THREE.Color().setRGB((i+1)/8, .4, .6)]));
  globalThis.geometry = { models, sources, modelGroup, dispose };
`).runInContext(context);
const { models, sources, modelGroup, dispose } = context.geometry;
assert.equal(models.length, techniques.length);
const labels = new Set(['id','label','group','text','scope','source','evidence']);
let states = 0;
for (const model of models) {
  const row = techniques.find(row => row.technique_id === model.id);
  assert.ok(row);
  assert.equal(row.label, model.label);
  assert.equal(row.description, model.text);
  assert.equal(row.limitation, model.scope);
  assert.equal(row.source_url, sources[model.source] ?? '');
  const params = Object.fromEntries(Object.entries(model).filter(([key]) => !labels.has(key)));
  assert.deepEqual(JSON.parse(JSON.stringify(params)), row.display_parameters);
  for (const open of [false, true]) {
    for (const stj of model.optionalStj ? [false, true] : [model.stj]) {
      const group = modelGroup({ ...model, stj }, open);
      let vertices = 0;
      group.traverse(object => {
        for (const [name, attribute] of Object.entries(object.geometry?.attributes ?? {})) {
          assert.ok([...attribute.array].every(Number.isFinite));
          if (name === 'position') vertices += attribute.count;
        }
        if (object.geometry?.index) assert.ok([...object.geometry.index.array].every(Number.isFinite));
      });
      assert.ok(vertices > 0);
      dispose(group);
      states++;
    }
  }
}
console.log(JSON.stringify({ status: 'PASS', dataset_counts: Object.fromEntries(
  Object.entries(datasets).map(([name, rows]) => [name, rows.length])),
  geometry_states: states, data_matches_display: true, links_and_denominators: 'PASS',
  browser_render_check: 'not_performed' }, null, 2));
