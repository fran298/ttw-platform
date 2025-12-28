from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = "apps.core"

    def ready(self):
        import apps.core.tasks  # 🔥 REGISTRA TODAS LAS TASKS