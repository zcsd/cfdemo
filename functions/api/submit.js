/**
 * POST /api/submit
 */

 export async function onRequestPost(context) {
	try {
		let submitInfo = await context.request.json();

        var country = context.request.cf.country;

        var date = new Date(Date.now());
        date.setHours(date.getHours() + 8);// I am in UTC+8
        var dateStr = date.toISOString();

        await sendToDB(context, submitInfo, dateStr, country);
        var count = await countFruit(context, submitInfo.fruit);

        var message = "You (" + submitInfo.nickname + " from " + country + ") are the " + count.toString() + "th person who prefers " + submitInfo.fruit + " in the database.";  

        var body = {"message": message, "ok": true};
        var options = { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }

        return new Response(JSON.stringify(body), options);
	} catch (err) {
		return new Response('Bad Request', { status: 400 });
	}
}

async function sendToDB(ctx, info, time, country) {
    var infoDoc = {
        "nickname": info.nickname,
        "fruit": info.fruit,
        "time": time,
        "country": country
    }

    var data = JSON.stringify({
        "dataSource": "Cluster0",
        "database": "cfdemo",
        "collection": "submitInfo",
        "document": infoDoc,
    });

    var endpointURL = 'https://data.mongodb-api.com/app/' + ctx.env.MONGO_APP_ID + '/endpoint/data/v1';

    var config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': ctx.env.MONGO_API_KEY,
        },
        body: data
    };

    await fetch(endpointURL+'/action/insertOne', config)
    .then(response => response.json())
    .then(data => {
        //console.log(data);
    })
    .catch(error => console.log(err));
}

async function countFruit(ctx, fruitName) {
    var data = JSON.stringify({
        "dataSource": "Cluster0",
        "database": "cfdemo",
        "collection": "submitInfo",
        "filter": {"fruit": fruitName},
    });

    var endpointURL = 'https://data.mongodb-api.com/app/' + ctx.env.MONGO_APP_ID + '/endpoint/data/v1';

    var config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': ctx.env.MONGO_API_KEY,
        },
        body: data
    };

    var result = 0;

    await fetch(endpointURL+'/action/find', config)
    .then(response => response.json())
    .then(data => {
        result = data.documents.length;
    })
    .catch(error => console.log(err));

    return result;
}