import {
    createServer as createHttpServer
} from 'node:http';

export const useHttp = () => {
    return createHttpServer();
}
