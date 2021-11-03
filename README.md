# slides2png

Un Apps Script que exporta todas las diapositivas de una presentación de Google a **imágenes png** independientes y las guarda en una carpeta anexa en Google Drive, surgido a partir de [este tuit](https://twitter.com/ejruizgarcia/status/1355974033247006723).

![](https://user-images.githubusercontent.com/12829262/106485177-9e6e9100-64b0-11eb-8b7c-ad4271711815.gif)

Copiar dentro del **editor de secuencias de comandos** de una presentación y ejecutar... o hacer copia de esta plantilla:

👉 [Presentación de ejemplo](https://docs.google.com/presentation/d/1DQ3rSwC2UGgKnXzvfRALLLNiFbg-ABTD4I-lJyXlb_c/template/preview) 👈

Se utilizan dos métodos distintos (**versión 1️⃣** · **versión 2️⃣**)**️**:

# **1️⃣ Archivo** [**URL exportación.gs**](https://github.com/pfelipm/slides2png/blob/main/URL%20exportaci%C3%B3n.gs)**:**

Se preparan URLs especialmente construidos para forzar la exportación de la 1ª diapositiva de la presentación en formato png y recuperarla como `blob` (`image/png`) usando `UrlFetchApp.fetch(url)`. Para evitar tener que compartir la presentación se inyecta en la URL un token OAuth, obtenido por el propio script, por medio del parámetro `?access_token=`.

```javascript
const url = `https://docs.google.com/presentation/d/${idPresentacionAux}/export/png?access_token=${ScriptApp.getOAuthToken()}`;
```

Dado que esta estrategia solo permite obtener la primera diapositiva, esta se desplaza al final de la presentación de manera sucesiva para recuperarlas todas. El script debe cerrar la presentación para que el cambio de posición de la diapositiva tenga efecto y volver a abrirla para repetir el proceso con las diapositivas restantes (un culebrón 😵):

```javascript
...
diapos[0].move(diapos.length);
presentacionAux.saveAndClose();
presentacionAux = SlidesApp.openById(idPresentacionAux);
diapos = presentacionAux.getSlides();
...
```

Como el script es de tipo embebido, es necesario generar una copia temporal de la presentación, de lo contrario la estrategia anterior no funcionará correctamente.

# **2️⃣ Archivo** [**API miniaturas.gs:**](https://github.com/pfelipm/slides2png/blob/main/API%20miniaturas.gs)

Se utiliza el [servicio avanzado de Diapositivas](https://developers.google.com/apps-script/advanced/slides) para generar la imágenes en miniatura de cada página por medio del método `presentations.pages.getThumbnail()`[🔗](https://developers.google.com/slides/reference/rest/v1/presentations.pages/getThumbnail), sin necesidad de los malabarismos 🤹 anteriores. Esto es preferible a tirar directamente de su API REST dado que de este modo se puede utilizar el proyecto GCP predeterminado, en lugar de configurar uno específico a través de la consola, con todo lo que ello supone (activar APIs, configuración pantalla OAuth, etc.). Este proceso previo puede evitarse obteniendo un token de acceso adecuado a través de alguno de los servicios integrados en Apps Script, claro está, pero en cualquier caso el procedimiento seguramente te resultará un tanto más rocambolesco, especialmente si estás dando tus primeros pasos con Apps Script. [Aquí](https://developers.google.cn/apps-script/guides/services/advanced) se comentan las diferencias entre tirar de servicios avanzados o sus APIs subyacentes, por si te apetece leer más.

```javascript
slidesComoPng = diapos.map(diapo => Slides.Presentations.Pages.getThumbnail(idPresentacion, diapo.getObjectId(), {'thumbnailProperties.mimeType':'PNG', 'thumbnailProperties.thumbnailSize':'MEDIUM'}));
```

La recuperación de los blobs correspondientes a las miniaturas de cada imagen puede efectuarse ahora de manera concurrente utilizando `UrlFetchApp.fetchAll(url)`[🔗](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetchAll(Object)) dado que no tenemos que andar ajustando la diapositiva que aparece en primera posición. Y esto es más limpio y eficiente, claro.

```javascript
const urls = slidesComoPng.map(diapo => {return {url: diapo.contentUrl}});
const blobsImg = UrlFetchApp.fetchAll(urls).map(url => url.getBlob());
```

Este segundo método es más elegante, conciso y rápido en ejecución (19" frente a 28" en una presentación con 10 diapositivas), por lo que debería utilizarse de manera preferente 👍.

Por cierto que la documentación de estos servicios avanzados en ocasiones resulta simplemente inexistente, limitándose a referenciar su correspondiente API REST. A veces, interpretar cómo se deben construir o utilizar los objetos que se pasan como parámetros de sus métodos cuando estos son invocados a través del correspondiente servicio avanzado no es obvio. En estas circunstancias suele resultar de ayuda ver qué código JavaScript genera el [explorador de la API](https://twitter.com/pfelipm/status/1356221409920495616) cuando se usa para realizar peticiones de prueba.

# Siguientes pasos

Esto igual daría para un complemento... (tal vez algún día) 🤔 .
