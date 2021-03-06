from django.conf.urls import patterns, url


urlpatterns = patterns(
    'walls.views',
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/$', 'wall_page', name='wall'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/upload/$', 'upload_image', name='upload_image'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/delete/$', 'delete_image', name='delete_image'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/update/$', 'update_image', name='update_image'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/status/$', 'wall_status', name='wall_status'),
    url(r'^(?P<wall_id>[0-9a-zA-Z]{6})/fork/$', 'fork_wall', name='fork_wall'),
)
