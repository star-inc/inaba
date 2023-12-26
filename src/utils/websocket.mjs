export function useSendMessage(ws) {
    return (data) => ws.send(JSON.stringify(data));
}

export function isWebSocketUpgradeRequest(req) {
    const upgradeHeader = req.headers['upgrade'];
    const connectionHeader = req.headers['connection'];

    return upgradeHeader && upgradeHeader.toLowerCase() === 'websocket' &&
        connectionHeader && connectionHeader.toLowerCase().includes('upgrade');
}
