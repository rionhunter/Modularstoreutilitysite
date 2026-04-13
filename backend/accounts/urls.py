from django.urls import path

from . import views

urlpatterns = [
    path('csrf/', views.csrf, name='csrf'),
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('signout/', views.signout, name='signout'),
    path('me/', views.me, name='me'),
]
