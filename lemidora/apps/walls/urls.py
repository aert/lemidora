from django.conf.urls import patterns, url


urlpatterns = patterns(
    'walls.views',
    url(r'^$', 'home_page'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/$', 'wall_page', name='wall'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/upload/$', 'upload_image'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/delete/$', 'delete_image'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/update/$', 'update_image'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/status/$', 'wall_status'),

    # Views for testing purposes
    url(r'^upload/$', 'upload_image_test'),
    url(r'^upload_page/$', 'upload_page'),
)
