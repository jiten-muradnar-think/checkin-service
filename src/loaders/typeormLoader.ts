import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { toNumber } from '../lib/env';
import { createConnection, getConnectionOptions } from 'typeorm';

import { env } from '../env';

export const typeormLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {

    const loadedConnectionOptions = await getConnectionOptions();
    const options = {
        type: env.db.type as any, // See createConnection options for valid types
        host: env.db.host,
        url: env.db.url,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
        synchronize: env.db.synchronize,
        logging: env.db.logging,
        entities: env.app.dirs.entities,
        migrations: env.app.dirs.migrations,
        ssl: env.db.ssl,
        authSource: env.db.authSource,
    } as any;
    if (env.db.port) {
        options.port = toNumber(env.db.port);
    }
    const connectionOptions = Object.assign(loadedConnectionOptions, options);
    const connection = await createConnection(connectionOptions);

    if (settings) {
        settings.setData('connection', connection);
        settings.onShutdown(() => connection.close());
    }
};
