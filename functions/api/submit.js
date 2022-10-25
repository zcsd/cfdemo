/**
 * POST /api/submit
 */
 import { connect } from '@planetscale/database'

 export async function onRequestPost(context) {
	try {
		let submitInfo = await context.request.json();

        var country = context.request.cf.country;

        var date = new Date(Date.now());
        date.setHours(date.getHours() + 8);// I am in UTC+8
        var dateStr = date.toISOString();

        var message;

        if (submitInfo.database == 'postgres') {
            var t0 = Date.now();
            await sendToDBPostgres(context, submitInfo, dateStr, country);
            var t1 = Date.now();
            const insertTime = t1 - t0;
            
            var t0 = Date.now();
            var count = await countFruitPostgres(context, submitInfo.fruit);
            var t1 = Date.now();
            const selectTime = t1 - t0;
    
            var message = "You (" + submitInfo.nickname + " from " + country + ") are the " + count.toString() + "th person who prefers " + submitInfo.fruit + " in the PostgreSQL database. <br>"
            message += "<span style='color:olive'>It took " + insertTime + " ms to INSERT to self-hosted PostgreSQL in Hong Kong Azure. </span><br>";
            message += "<span style='color:olive'>It took " + selectTime + " ms to SELECT from self-hosted PostgreSQL in Hong Kong Azure. </span><br>"; 
        } else if (submitInfo.database == 'mongo') {
            var t0 = Date.now();
            await sendToDBMongo(context, submitInfo, dateStr, country);
            var t1 = Date.now();
            const insertTime = t1 - t0;
            
            var t0 = Date.now();
            var count = await countFruitMongo(context, submitInfo.fruit);
            var t1 = Date.now();
            const selectTime = t1 - t0;
    
            message = "You (" + submitInfo.nickname + " from " + country + ") are the " + count.toString() + "th person who prefers " + submitInfo.fruit + " in the MongoDB database. <br>"
            message += "<span style='color:olive'>It took " + insertTime + " ms to INSERT to free MongoDB Atlas in Singapore AWS. </span><br>";
            message += "<span style='color:olive'>It took " + selectTime + " ms to SELECT from free MongoDB Atlas in Singapore AWS. </span><br>";  
        } else if (submitInfo.database == 'planetscale') {
            const pscaleConfig = {
                host: context.env.PSCALE_HOST,
                username: context.env.PSCALE_USERNAME,
                password: context.env.PSCALE_PASSWORD
            };
            const pscaleConn = connect(pscaleConfig);

            var t0 = Date.now();
            await pscaleConn.execute('INSERT INTO submitinfo (nickname, fruit, time, country) VALUES (?, ?, ?, ?)', [submitInfo.nickname, submitInfo.fruit, dateStr, country]);
            var t1 = Date.now();
            const insertTime = t1 - t0; 

            var t0 = Date.now();
            const countRes = await pscaleConn.execute('SELECT COUNT(*) FROM submitinfo WHERE fruit = ?', [submitInfo.fruit]);
            var t1 = Date.now();
            const selectTime = t1 - t0;

            const countStr = countRes.rows[0][Object.keys(countRes.rows[0])[0]];

            message = "You (" + submitInfo.nickname + " from " + country + ") are the " + countStr + "th person who prefers " + submitInfo.fruit + " in the Planetscale MySQL. <br>"
            message += "<span style='color:olive'>It took " + insertTime + " ms to INSERT to free Planetscale MySQL in Singapore AWS. </span><br>";
            message += "<span style='color:olive'>It took " + selectTime + " ms to SELECT from free Planetscale MySQL in Singapore AWS. </span><br>";  
        }
        
        var body = {"message": message, "ok": true};
        var options = { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }

        return new Response(JSON.stringify(body), options);
	} catch (err) {
		return new Response('Bad Request', { status: 400 });
	}
}

// insert to self-hosted PostgreSQL via CF Worker
async function sendToDBPostgres(ctx, info, time, country) {
    var infoDoc = {
        "type": "insert",
        "nickname": info.nickname,
        "fruit": info.fruit,
        "time": time,
        "country": country
    }

    var config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': ctx.env.POSTGRES_KEY,
        },
        body: JSON.stringify(infoDoc),
    };

    await fetch(ctx.env.POSTGRES_URL, config)
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => console.log(err));
}

// select from self-hosted PostgreSQL via CF Worker
async function countFruitPostgres(ctx, fruitName) {
    var infoDoc = {
        "type": "select",
        "fruit": fruitName,
    }

    var config = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': ctx.env.POSTGRES_KEY,
        },
        body: JSON.stringify(infoDoc),
    };

    var result = 0;

    await fetch(ctx.env.POSTGRES_URL, config)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        result = parseInt(data);
    })
    .catch(error => console.log(err));

    return result;
}

// insert to MongoDB Atlas via official Data API
async function sendToDBMongo(ctx, info, time, country) {
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

// select from MongoDB Atlas via official Data API
async function countFruitMongo(ctx, fruitName) {
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