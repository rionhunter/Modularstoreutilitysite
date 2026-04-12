from django.test import Client, TestCase
from django.urls import reverse
from django.contrib.auth.models import User

from .models import StoreData


class StoreDataApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='owner', password='secret123')
        self.other_user = User.objects.create_user(username='other', password='secret123')

    def test_requires_authentication(self):
        response = self.client.get(reverse('store-data-list'))
        self.assertEqual(response.status_code, 401)

    def test_upsert_get_list_and_delete_store_data(self):
        self.client.login(username='owner', password='secret123')

        upsert_response = self.client.put(
            reverse('store-data-detail', kwargs={'store_key': 'store-layout-full'}),
            data='{"payload":{"gridWidth":20}}',
            content_type='application/json',
        )
        self.assertEqual(upsert_response.status_code, 200)
        self.assertEqual(StoreData.objects.filter(user=self.user).count(), 1)

        get_response = self.client.get(reverse('store-data-detail', kwargs={'store_key': 'store-layout-full'}))
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()['payload']['gridWidth'], 20)

        list_response = self.client.get(reverse('store-data-list'))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()['items']), 1)

        delete_response = self.client.delete(reverse('store-data-detail', kwargs={'store_key': 'store-layout-full'}))
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(StoreData.objects.filter(user=self.user).count(), 0)

    def test_data_is_scoped_by_user(self):
        StoreData.objects.create(user=self.other_user, store_key='tasks', payload={'value': 1})
        self.client.login(username='owner', password='secret123')

        response = self.client.get(reverse('store-data-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['items'], [])

    def test_accepts_list_payload(self):
        self.client.login(username='owner', password='secret123')
        response = self.client.put(
            reverse('store-data-detail', kwargs={'store_key': 'tasks'}),
            data='{"payload":[{"task":"a"},{"task":"b"}]}',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['payload'][0]['task'], 'a')

    def test_rejects_overlong_store_key(self):
        self.client.login(username='owner', password='secret123')
        response = self.client.put(
            reverse('store-data-detail', kwargs={'store_key': 'x' * 101}),
            data='{"payload":{"ok":true}}',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)


class StoreDataCsrfTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='csrf_user', password='secret123')
        self.client = Client(enforce_csrf_checks=True)
        self.client.force_login(self.user)

    def test_put_requires_csrf(self):
        response = self.client.put(
            reverse('store-data-detail', kwargs={'store_key': 'tasks'}),
            data='{"payload":{"x":1}}',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)
