/**
 * GET /api/get-files
 */
export async function onRequest(context) {
    var message = '';
    try {
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
    } catch (err) {
        return new Response('Bad Request', { status: 400 });
    }

    var body = {"message": message, "ok": true};
    var options = { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }

    return new Response(JSON.stringify(body), options);
}
