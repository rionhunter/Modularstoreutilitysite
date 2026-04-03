import json

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class AccountsApiTests(TestCase):
    def test_signup_creates_user_and_session(self):
        response = self.client.post(
            reverse('signup'),
            data=json.dumps({'username': 'alice', 'password': 'secret123'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='alice').exists())

        me_response = self.client.get(reverse('me'))
        self.assertEqual(me_response.status_code, 200)
        self.assertTrue(me_response.json()['authenticated'])

    def test_signin_with_invalid_credentials_fails(self):
        User.objects.create_user(username='bob', password='secret123')

        response = self.client.post(
            reverse('signin'),
            data=json.dumps({'username': 'bob', 'password': 'wrongpass'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)

    def test_signout_clears_authentication(self):
        User.objects.create_user(username='carol', password='secret123')
        self.client.post(
            reverse('signin'),
            data=json.dumps({'username': 'carol', 'password': 'secret123'}),
            content_type='application/json',
        )

        signout_response = self.client.post(reverse('signout'))
        self.assertEqual(signout_response.status_code, 200)

        me_response = self.client.get(reverse('me'))
        self.assertEqual(me_response.status_code, 200)
        self.assertFalse(me_response.json()['authenticated'])

# Create your tests here.
