

const BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '';


export async function getLatestObservations() {
    const res = await fetch(`${BASE_URL}/api/observation/latest`);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return res.json();
}


export async function getObservations(nodes, start) {
    const url = new URL(`${BASE_URL}/api/observation`);
    url.searchParams.set('nodes', nodes.join(','));
    url.searchParams.set('start', start.toISOString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return res.json();
}


export async function pushObservation(nodeId, data) {
    const res = await fetch(`${BASE_URL}/api/observation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: nodeId, data }),
    });
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return res.json();
}
