import { SymbolSyncer } from '../modules/symbol-syncer';

const config = require('../../../tradejs.config.js');

export const symbolController = {

    symbolSyncer: new SymbolSyncer(),

    init() {
        this.symbolSyncer.sync();
        this.symbolSyncer.startSyncInterval();
    },

	getPublicList(): Array<any> {
		return this.symbolSyncer.symbols;
	}
};