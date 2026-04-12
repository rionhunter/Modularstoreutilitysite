import json

from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET, require_POST

User = get_user_model()


def _json_body(request):
    if not request.body:
        return {}
    return json.loads(request.body.decode('utf-8'))


@require_POST
def signup(request):
    try:
        data = _json_body(request)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if len(username) < 3:
        return JsonResponse({'error': 'Username must be at least 3 characters'}, status=400)
    if len(password) < 6:
        return JsonResponse({'error': 'Password must be at least 6 characters'}, status=400)
    try:
        user = User.objects.create_user(username=username, password=password)
    except IntegrityError:
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=409)
        raise
    login(request, user)
    return JsonResponse({'id': user.id, 'username': user.username}, status=201)


@require_POST
def signin(request):
    try:
        data = _json_body(request)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username or not password:
        return JsonResponse({'error': 'Username and password are required'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid username or password'}, status=401)

    login(request, user)
    return JsonResponse({'id': user.id, 'username': user.username})


@require_POST
def signout(request):
    logout(request)
    return JsonResponse({'ok': True})


@require_GET
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'authenticated': False})
    return JsonResponse(
        {
            'authenticated': True,
            'user': {'id': request.user.id, 'username': request.user.username},
        }
    )


@require_GET
def csrf(request):
    token = get_token(request)
    return JsonResponse({'csrfToken': token})
