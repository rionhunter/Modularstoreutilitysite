import json

from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_http_methods

from .models import StoreData


def _json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode('utf-8'))


@require_GET
def list_store_data(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    records = StoreData.objects.filter(user=request.user).values('store_key', 'payload', 'updated_at')
    data = []
    for record in records:
        data.append(
            {
                'store_key': record['store_key'],
                'payload': record['payload'],
                'updated_at': record['updated_at'].isoformat(),
            }
        )
    return JsonResponse({'items': data})


@require_http_methods(['GET', 'PUT', 'DELETE'])
def store_data_detail(request, store_key):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    if len(store_key) > 100:
        return JsonResponse({'error': 'Invalid store key'}, status=400)

    if request.method == 'GET':
        try:
            record = StoreData.objects.get(user=request.user, store_key=store_key)
        except StoreData.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse(
            {
                'store_key': record.store_key,
                'payload': record.payload,
                'updated_at': record.updated_at.isoformat(),
            }
        )

    if request.method == 'PUT':
        try:
            data = _json_body(request)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON body'}, status=400)
        if not isinstance(data, dict):
            return JsonResponse({'error': 'Request body must be a JSON object'}, status=400)
        if 'payload' not in data:
            return JsonResponse({'error': 'payload is required'}, status=400)

        payload = data['payload']

        record, _ = StoreData.objects.update_or_create(
            user=request.user,
            store_key=store_key,
            defaults={'payload': payload},
        )
        return JsonResponse(
            {
                'store_key': record.store_key,
                'payload': record.payload,
                'updated_at': record.updated_at.isoformat(),
            }
        )

    deleted, _ = StoreData.objects.filter(user=request.user, store_key=store_key).delete()
    if deleted == 0:
        return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'ok': True})

# Create your views here.
