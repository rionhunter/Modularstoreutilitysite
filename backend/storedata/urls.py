from django.urls import path

from . import views

urlpatterns = [
    path('', views.list_store_data, name='store-data-list'),
    path('<str:store_key>/', views.store_data_detail, name='store-data-detail'),
]
