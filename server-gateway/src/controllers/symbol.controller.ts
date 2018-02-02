import { SymbolSyncer } from '../modules/symbol-syncer';

const config = require('../../../tradejs.config');

export const symbolController = {

    symbolSyncer: null,

    async init() {
        this.symbolSyncer = new SymbolSyncer();
        await this.symbolSyncer.load();
    },

	getPublicList(): Array<any> {
		return this.symbolSyncer.symbols;
	}
};