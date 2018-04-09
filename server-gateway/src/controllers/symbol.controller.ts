import { SymbolSyncer } from '../modules/symbol-syncer';

const config = require('../../../tradejs.config');

export const symbolController = {

    symbolSyncer: new SymbolSyncer(),

    async init() {
        await this.symbolSyncer.sync();
        this.symbolSyncer.startSyncInterval();
    },

	getPublicList(): Array<any> {
		return this.symbolSyncer.symbols;
	}
};