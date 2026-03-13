const fs = require('fs/promises');
const BASE_URL = "http://localhost:3000/api";

async function simpleFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        throw Error(
            `${url}
            ${res.status} ${res.statusText}`
        );
    }
    return res;
}

async function listenNotifications(token) {
    const reader = await simpleFetch(`${BASE_URL}/notifications?token=${token}`)
        .then(res => res.body.getReader())
        .catch(err => { throw err; });

    const decoder = new TextDecoder("utf8");

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            console.log("[sse] disconnected");
            break;
        }

        const text = decoder.decode(value, { stream: true });
        console.log(`[sse] ${text}`);
    }
}



async function loop(token) {
    await simpleFetch(`${BASE_URL}/to-do`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
            "description": "test",
            "date": new Date()
        }),
    });

    const res = await simpleFetch(`${BASE_URL}/to-do?date=${new Date()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json; charset=UTF-8",
        },
    });

    const todoId = await res.json()
        .then(data => data.results.at(-1)?.id)
        .catch(err => { throw err; });

    await simpleFetch(`${BASE_URL}/to-do/${todoId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
    });
}

async function main() {
    const token = await fs.readFile("./test-token", 'utf8');
    listenNotifications(token).catch(err => { throw err; });

    while (true) {
        try {
            await loop(token);
        }
        catch (err) {
            console.error(err);
            break;
        }
    }
}

main();
