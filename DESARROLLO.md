# Cómo levantar el proyecto

```bash
npm install        # solo la primera vez, en la raíz
npm run dev        # los dos servidores, con recarga en caliente
```

| | Dirección |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4001/api |

**Por qué el backend está en 4001 y no en 4000:** en esta máquina el 4000 lo
ocupa el API de `smartbeemo`. Si en la tuya está libre, cambia `PORT` en
`backend/.env` y `API_URL` en `frontend/.env.local` — son los dos únicos
sitios donde vive el puerto.

## Qué se recarga solo

| Cambias… | Qué pasa |
| --- | --- |
| Código del frontend | Turbopack recompila la ruta afectada |
| Código del backend | Nest recompila y reinicia |
| **`backend/.env`** | **El envoltorio reinicia el backend** |

Lo tercero necesitó código propio. `dotenv` lee el `.env` **una sola vez**, al
arrancar: cambiar una variable no tiene ningún efecto hasta que el proceso
muere y vuelve. Eso hizo que dos pruebas dieran conclusiones equivocadas en
una misma tarde.

Se intentó primero la vía de Nest —declarar el `.env` como *asset* con
`watchAssets`— y no sirve para un archivo que vive fuera de `sourceRoot`:
falla con `EISDIR`. Así que `backend/scripts/dev.mjs` vigila el archivo y,
cuando cambia, mata el proceso de Nest y lo levanta otra vez.

Verificado: cambiar `JWT_ACCESS_TTL` de `15m` a `2m` reinicia el backend y el
siguiente token dura, medido en su propia carga, dos minutos.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Los dos servidores, salida etiquetada `[api]` y `[web]` |
| `npm run stop` | Apaga **solo** los de este proyecto |
| `npm run check` | Tipos y lint de los dos |
| `npm run typecheck` | Solo los tipos |
| `npm run lint` | Solo el lint |
| `npm run build` | Compila los dos para producción |

### Sobre `npm run stop`

Existe porque `pkill -f "next dev"` mata también el servidor de cualquier
otro proyecto abierto en la máquina — y en esta convivió con el de
`smartbeemo`. El script comprueba el directorio de trabajo de cada proceso
antes de tocarlo y avisa cuando deja uno en paz:

```
· 46042 es de otro proyecto, no se toca
✓ 64825 (nest start) detenido
```

## Variables sin declarar en tu `.env`

Estas existen en `.env.example` y no en `backend/.env`, así que corren con el
valor por defecto del código. Funciona, pero conviene saberlo porque cambiar
uno de esos valores exige declararlo primero:

`ACCESS_DEFAULT_MONTHS` · `ACTIVATION_TTL_HOURS` · `PENSION_DEFAULT_RETURN_RATE` ·
`SELF_REGISTRATION_ENABLED` · `SESSION_MAX_PER_USER` ·
`SESSION_ROTATION_GRACE_MS` · `TRUST_PROXY_HOPS`

## Si el frontend no ve tus cambios

Casi siempre es esto: **`next build` mató el vigilante de `next dev`.** Los
dos usan la carpeta `.next`. Si pasa:

```bash
npm run stop
rm -rf frontend/.next
npm run dev
```
