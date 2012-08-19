from sorl.thumbnail.images import ImageFile
from sorl.thumbnail.shortcuts import get_thumbnail
from walls.models import WallImage
from walls.services.wall_service import WallService
from sorl.thumbnail import default


class WallImageService(object):
    DEFAULT_WIDTH = 300
    DEFAULT_HEIGHT = 300
    CROP_MODE = 'center'
    DEFAULT_X_OFFSET = 20
    DEFAULT_Y_OFFSET = 20

    wall_service = WallService()

    def create_image(self, user, wall, image_data, x, y):
        """
        Create list of images
        :param user: User instance
        :param wall: Wall instance
        :param image_data: image file instance
        :param x: X coordinate
        :param y: Y coordinate
        """

        image = WallImage()
        image.wall = wall
        image.image_file = image_data
        image.created_by = user
        image.updated_by = user

        image.x = x
        image.y = y
        image.width = self.DEFAULT_WIDTH
        image.height = self.DEFAULT_HEIGHT

        image.save()

        image.width, image.height = self.get_geometry(image.image_file)

        self.add_thumbnail(image)

        image.width = image.thumbnail.width
        image.height = image.thumbnail.height
        image.save()

        return image

    def get_geometry(self, image_file):
        image = ImageFile(image_file)
        source_image = default.engine.get_image(image)
        size = default.engine.get_image_size(source_image)
        image.set_size(size)
        if image.is_portrait():
            return None, self.DEFAULT_HEIGHT
        else:
            return self.DEFAULT_WIDTH, None

    def __update_image_data(self, image, image_data):
        image.title = image_data.title
        if image_data.x is not None:
            image.x = image_data.x
        if image_data.y is not None:
            image.y = image_data.y
        if image_data.z is not None:
            image.z = image_data.z
        if image_data.rotation is not None:
            image.rotation = image_data.rotation
        if image_data.width is not None:
            image.width = image_data.width
        if image_data.height is not None:
            image.height = image_data.height

    def update_image(self, user, image_data):
        # TODO: check permission

        image = self.get_image(user, image_data.id)

        self.__update_image_data(image, image_data)

        image.updated_by = user

        image.save()
        self.add_thumbnail(image)
        return image

    def _format_geometry(self, image):
        if not image.height and not image.width:
            return "%s" % str(self.DEFAULT_WIDTH)
        if not image.height:
            return '%s' % str(image.width)
        if not image.width:
            return 'x%s' % str(image.height)
        return '%sx%s' % (image.width, image.height)

    def add_thumbnail(self, image):
        geometry = self._format_geometry(image)

        image.thumbnail = get_thumbnail(
            image.image_file,
            geometry,
            crop=self.CROP_MODE,
            quality=99
        )

    def delete_image(self, user, id):
        # TODO: check permission
        image = self.get_image(user, id)
        image.delete()

    def get_image(self, user, id):
        # TODO: check permission
        image = WallImage.objects.get(id=id)
        self.add_thumbnail(image)
        return image

    def get_wall_images(self, user, wall_id):
        # TODO: check permission
        images = list(WallImage.objects.filter(wall=wall_id))
        for image in images:
            self.add_thumbnail(image)
        return images
