# slides2png

Un Apps Script que exporta todas las diapositivas de una presentación de Google a PNG y las guarda en Google Drive.

![](https://user-images.githubusercontent.com/12829262/106485177-9e6e9100-64b0-11eb-8b7c-ad4271711815.gif)

Copiar dentro del **editor de secuencias de comandos** de una presentación y ejecutar... o hacer copia de esta plantilla:

👉 [Presentación de ejemplo](https://docs.google.com/presentation/d/1DQ3rSwC2UGgKnXzvfRALLLNiFbg-ABTD4I-lJyXlb_c/template/preview) 👈

# ¿Cómo funciona?

Se utilizan dos métodos distintos:

**v1:** Preparar URLs especialmente construidos para forzar la exportación de la 1ª diapositiva de la presentación en formato png y recuperarla como `blob` (`image/png`) usando `UrlFetchApp.fetch(url)`. Para evitar tener que compartir la presentación se inyecta en la URL un token OAuth obtenido por el propio script por medio del parámetro `?access_token=`.

```javascript
const url = `https://docs.google.com/presentation/d/${idPresentacionAux}/export/png?access_token=${ScriptApp.getOAuthToken()}`;
```

Dado que esta estrategia solo permite obtener la primera diapositiva, esta se desplaza al final de la presentación de manera iterativa para recuperarlas todas. Es necesario cerrar la presentación para que el cambio de posición de la diapositiva tenga efecto, y volver a abrirla para repetir el proceso con las diapositivas restantes:

```javascript
presentacionAux.saveAndClose();
```

Como el script es de tipo embebido, es necesario generar una copia temporal de la presentación, de lo contrario no es posible utilizar el _truco_ anterior.

v2: 

# Siguientes pasos

Esto igual daría para un complemento... (algún día) 🤔 .
