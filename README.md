# slides2png

Un Apps Script que exporta todas las diapositivas de una presentación de Google a **imágenes png** independientes y las guarda en una carpeta anexa en Google Drive.

![](https://user-images.githubusercontent.com/12829262/106485177-9e6e9100-64b0-11eb-8b7c-ad4271711815.gif)

Copiar dentro del **editor de secuencias de comandos** de una presentación y ejecutar... o hacer copia de esta plantilla:

👉 [Presentación de ejemplo](https://docs.google.com/presentation/d/1DQ3rSwC2UGgKnXzvfRALLLNiFbg-ABTD4I-lJyXlb_c/template/preview) 👈

# ¿Cómo funciona?

Se utilizan dos métodos distintos (**v1** y **v2**):

**1️⃣** Preparar URLs especialmente construidos para forzar la exportación de la 1ª diapositiva de la presentación en formato png y recuperarla como `blob` (`image/png`) usando `UrlFetchApp.fetch(url)`. Para evitar tener que compartir la presentación se inyecta en la URL un token OAuth, obtenido por el propio script, por medio del parámetro `?access_token=`.

```javascript
const url = `https://docs.google.com/presentation/d/${idPresentacionAux}/export/png?access_token=${ScriptApp.getOAuthToken()}`;
```

Dado que esta estrategia solo permite obtener la primera diapositiva, esta se desplaza al final de la presentación de manera sucesiva para recuperarlas todas. Hay que cerrar la presentación, para que el cambio de posición de la diapositiva tenga efecto, y volver a abrirla para repetir el proceso con las diapositivas restantes:

```javascript
...
diapos[0].move(diapos.length);
presentacionAux.saveAndClose();
presentacionAux = SlidesApp.openById(idPresentacionAux);
diapos = presentacionAux.getSlides();
...
```

Como el script es de tipo embebido, es necesario generar una copia temporal de la presentación, de lo contrario la estrategia anterior no funcionará correctamente.

**2️⃣** Se utiliza el [servicio avanzado de Diapositivas](https://developers.google.com/apps-script/advanced/slides) para generar miniaturas de cada página, sin necesidad de los malabarismos 🤹 anteriores . Esto es preferible a tirar directamente de su API REST dado que de este modo se puede utilizar el proyecto GCP predeterminado, en lugar de configurar uno específico a través de la consola, con todo lo que ello supone (activar APIs, configuración pantalla OAuth, etc.).

```javascript
slidesComoPng = diapos.map(diapo => Slides.Presentations.Pages.getThumbnail(idPresentacion, diapo.getObjectId(), {'thumbnailProperties.mimeType':'PNG', 'thumbnailProperties.thumbnailSize':'MEDIUM'}));
```

La recuperación de los blobs correspondientes a las miniaturas de cada imagen se realiza ahora utilizando `UrlFetchApp.fetchAll(url)` por razones de eficiencia.

```javascript
const urls = slidesComoPng.map(diapo => {return {url: diapo.contentUrl}});
const blobsImg = UrlFetchApp.fetchAll(urls).map(url => url.getBlob());
```

Este segundo método es más elegante, conciso y rápido en ejecución (19" frente a 28" en una presentación con 10 diapositivas), por lo que debería ser preferible  👍 al primero.

# Siguientes pasos

Esto igual daría para un complemento... (tal vez algún día) 🤔 .
