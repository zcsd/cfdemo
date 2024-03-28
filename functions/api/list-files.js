/**
 * GET /api/get-files
 */
export async function onRequestPost(context) {
    var message = '';
    try {
        let submitInfo = await context.request.json();
        let turnstile_token = submitInfo.token;

        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: JSON.stringify({
                response: turnstile_token,
                secret: context.env.TURNSTILE_SECRET_KEY 
            }),
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
        });

        const turnstileOutcome = await turnstileResult.json();
        if (!turnstileOutcome.success) {
            let message = "Failed to pass the Cloudflare Turnstile verification. Please refresh page.";
            var body = {"message": message, "ok": true};
            var op = { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    
            return new Response(JSON.stringify(body), op);
        }

        const options = {
            limit: 5,
            prefix: 'fruits/',
        }
        const listing = await context.env.IMAGE_BUCKET.list(options);
        if (listing.objects.length == 0) {
            message = 'No files found.';
        }else {
            // iterate through listing.objects
            for (var i = 0; i < listing.objects.length; i++) {
                message += listing.objects[i].key;
                message += ',   ';
            }
        }

        var body = {"message": message, "ok": true};
        var newOptions = { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    
        return new Response(JSON.stringify(body), newOptions);
    } catch (err) {
        var body = {"message": "Internal Server Error, try again later.", "ok": true};
        var options = { status: 400, headers: { 'Content-Type': 'application/json;charset=utf-8' } }
    
        return new Response(JSON.stringify(body), options);
    }
}
