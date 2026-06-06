// In dev, Vite proxies /api → http://localhost:5173 (tri-hita-green backend).
// In production, set VITE_API_BASE_URL to the deployed backend origin.
const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '';

/**
 * GET /api/observation/latest
 * Returns the most recent observation for every active node.
 * @returns {Promise<Array<{node_id: string, humidity: number, lightLevel: number, soilMoisture: number, temperature: number, timestamp: string}>>}
 */
export async function getLatestObservations() {
    const res = await fetch(`${BASE_URL}/api/observation/latest`);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return res.json();
}

/**
 * GET /api/observation?nodes=n1,n2&start=ISO_DATE
 * Returns observations for the given nodes since start.
 * @param {string[]} nodes
 * @param {Date} start
 */
export async function getObservations(nodes, start) {
    const url = new URL(`${BASE_URL}/api/observation`);
    url.searchParams.set('nodes', nodes.join(','));
    url.searchParams.set('start', start.toISOString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return res.json();
}

/**
 * POST /api/observation
 * Push a new observation from a node.
 * @param {string} nodeId
 * @param {{ humidity: number, lightLevel: number, soilMoisture: number, temperature: number }} data
 */
export async function pushObservation(nodeId, data) {
    const res = await fetch(`${BASE_URL}/api/observation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: nodeId, data }),
    });
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return res.json();
}
