/**
 * GET /api/get-files
 */
export async function onRequest(context) {

    var message;

    try {
        const options = {
            limit: 5,
            prefix: 'fruits/',
        }
        const listing = await context.env.IMAGE_BUCKET.list(options);
        console.log(listing.objects.length);
        message = listing.objects.length.toString();
    } catch (err) {
        return new Response('Bad Request', { status: 400 });
    }

    var body = {"message": message, "ok": true};
    var options = { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } }

    return new Response(JSON.stringify(body), options);
}   