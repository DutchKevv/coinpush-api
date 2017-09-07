import {Router} from 'express';
import {Order} from '../schemas/order';
import {
	BROKER_ERROR_INVALID_ARGUMENT,
	BROKER_ERROR_MARKET_CLOSED, BROKER_ERROR_UNKNOWN, BROKER_OANDA_ERROR_INVALID_ARGUMENT, BROKER_OANDA_ERROR_MARKET_CLOSED,
	ORDER_TYPE_MARKET
} from '../../../shared/constants/constants';
import {orderController} from '../controllers/order.controller';

const router = Router();

router.post('/', async (req, res) => {

	let params = <any>{
		amount: req.body.amount,
		symbol: req.body.symbol,
		side: req.body.side,
		stopLoss: req.body.stopLoss,
		takeProfit: req.body.takeProfit,
		trailingStop: req.body.trailingStop,
		type: req.body.type || ORDER_TYPE_MARKET,
		user: req.user.id
	};

	if (typeof params.symbol !== 'string' ||
		typeof params.amount !== 'number' ||
		typeof params.side !== 'number') {
		return res.status(400).send('Missing attributes');
	}

	try {
		res.send(await orderController.create(params));
	} catch (error) {
		switch (error.code) {
			case BROKER_ERROR_INVALID_ARGUMENT:
				res.status(400).send(error);
				break;
			case BROKER_ERROR_MARKET_CLOSED:
				res.status(403).send(error);
				break;
			case BROKER_ERROR_UNKNOWN:
				res.status(500).send('Unknown error');
				break;
			default:
				res.status(500).send({
					code: BROKER_ERROR_UNKNOWN,
					error: 'undocumented error occurred'
				});
		}
	}
});

router.get('/:id', function (req, res, next) {

	Order.findById(req.params.id)
		.exec(function (error, user) {
			if (error) {
				return next(error);
			} else {
				if (user === null) {
					const err = new Error('Not authorized! Go back!');
					err['status'] = 400;
					return next(err);
				} else {
					return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: </h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
				}
			}
		});
});

router.delete('/:id', function (req: any, res, next) {

	Order.follow(req.user.id, req.params.id, error => {
		if (error)
			return next(error);

		res.status(200).end();
	});
});

router.put('/:id', function (req: any, res, next) {

	Order.unFollow(req.user.id, req.params.id, error => {
		if (error)
			return next(error);

		res.status(200).end();
	});
});

export = router;