import { SymbolSyncer } from '../modules/symbol-syncer';
import { config } from 'coinpush/src/util/util-config';

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