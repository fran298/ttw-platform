import csv
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.locations.models import City, Country


class Command(BaseCommand):
    help = "Import world cities from GeoNames (cities15000.txt)"

    def handle(self, *args, **kwargs):
        path = "data/cities15000.txt"  # relativo a la carpeta donde está manage.py

        self.stdout.write("🚀 Importing cities from %s..." % path)

        # Limpia tablas (opcional)
        City.objects.all().delete()
        Country.objects.all().delete()

        countries_cache = {}

        with open(path, encoding="utf-8") as file:
            reader = csv.reader(file, delimiter="\t")

            for row in reader:
                name = row[1]
                latitude = float(row[4])
                longitude = float(row[5])
                country_code = row[8]

                if not country_code:
                    continue

                if country_code not in countries_cache:
                    country, _ = Country.objects.get_or_create(
                        code=country_code,
                        defaults={"name": country_code}
                    )
                    countries_cache[country_code] = country

                City.objects.get_or_create(
                    name=name,
                    country=countries_cache[country_code],
                    defaults={
                        "slug": slugify(f"{name}-{country_code}"),
                        "latitude": latitude,
                        "longitude": longitude,
                    },
                )

        self.stdout.write(self.style.SUCCESS("✅ Cities imported successfully"))