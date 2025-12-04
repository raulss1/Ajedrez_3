Vídeo: https://www.youtube.com/watch?v=XWNpH_e9NDQ

**Visión General**

El proyecto presenta un entorno tridimensional interactivo donde un tablero de ajedrez y sus piezas cobran vida mediante la combinación de animaciones interpoladas y simulación física. El sistema integra dos componentes fundamentales: interpolación de transformaciones (Tweening) para movimientos suaves y controlados, y dinámica física con Ammo.js para dotar a las piezas de comportamiento realista ante colisiones, inclinaciones o impactos externos.

**Uso de Tween.js**

Tween.js actúa como un motor de animación paramétrica que permite interpolar valores numéricos en el tiempo. En este contexto, su función principal es gestionar el desplazamiento de las piezas de ajedrez entre casillas.

Permite movimientos fluidos sin necesidad de escribir funciones físicas complejas.

Controla la transición entre posiciones iniciales y finales respetando aceleración, desaceleración y suavidad.

Garantiza coherencia visual: la pieza sigue un trayecto definido, predecible y adecuado para representar el pensamiento estratégico del ajedrez.

En conjunto, Tween.js aporta la “intencionalidad” del movimiento: cada desplazamiento tiene un propósito lógico y una estética definida.

**Uso de Ammo.js**

Ammo.js introduce al entorno un modelo físico riguroso basado en Bullet Physics, permitiendo que las piezas no solo se muevan, sino que también interactúen con el espacio y respondan a fuerzas externas.

Sus funciones principales dentro del proyecto son:

Gestionar cuerpos rígidos para cada pieza, con masa, fricción y colisionadores.

Detectar caídas, inclinaciones excesivas o impactos.

Mantener la coherencia tridimensional: una pieza empujada, golpeada o volcada se comporta de manera realista.

La física no controla los movimientos propios del ajedrez (eso lo hace Tween), sino el comportamiento emergente ante el entorno y el usuario, enriqueciendo la experiencia interactiva.

**Relación entre Tween y Ammo**

El sistema combina movimiento planificado y simulación emergente:

Tween.js define la lógica del juego: desplazamientos exactos, rutas controladas y animaciones suaves.

Ammo.js garantiza la consistencia física: estabilidad, gravedad, colisiones y respuesta al entorno.

Este enfoque híbrido permite que el usuario experimente un tablero que no solo muestra jugadas, sino que también reacciona físicamente cuando se interactúa con él, logrando un equilibrio entre fidelidad visual y realismo dinámico.

**Conclusión**

El modelo se fundamenta en la cooperación entre interpolación y física. Tween.js aporta dirección y claridad animada; Ammo.js aporta credibilidad y coherencia física. Juntas convierten un tablero de ajedrez en un entorno tridimensional vivo, interactivo y didáctico.
