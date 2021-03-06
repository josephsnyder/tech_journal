from girder.models.model_base import AccessControlledModel


class DownloadStatistics(AccessControlledModel):
    def initialize(self):
        self.name = 'journal_downloads'

    def validate(self, entry):
        return entry

    # Taken from the settings module
    def get(self, key, default='__default__'):
        """
        Retrieve a setting by its key.

        :param key: The key identifying the setting.
        :type key: str
        :param default: If no such setting exists, returns this value instead.
        :returns: The value, or the default value if the key is not found.
        """
        setting = self.findOne({'key': key})
        if setting is None:
            if default == '__default__':
                default = self.getDefault(key)
            return default
        else:
            return setting['value']

    def getAllByTag(self, tag, default='__default__'):
        """
        Retrieve a setting by its key.

        :param key: The key identifying the setting.
        :type key: str
        :param default: If no such setting exists, returns this value instead.
        :returns: The value, or the default value if the key is not found.
        """
        objectList = self.find({'tag': tag})
        values = {}
        for setting in objectList:
            values[setting["key"]] = setting
        return values

    def set(self, key, value, tag='setting'):
        """
        Save a setting. If this key already exists,
        this will replace the existing value.

        :param key: The key identifying the setting.
        :type key: str
        :param value: The object to store for this setting.
        :returns: The document representing the saved Setting.
        """
        setting = self.findOne({'key': key})
        if setting is None:
            setting = {
                'key': key,
                'value': value
            }
        else:
            setting['value'] = value
        setting['tag'] = tag

        return self.save(setting)
