import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonModal,
  IonInput,
  IonButton
} from '@ionic/angular';

import { Preferences } from '@capacitor/preferences';


interface Carta {
  id: number;
  parejaId: number;
  imagen: string;
  descubierta: boolean;
  encontrada: boolean;
}


interface ResultadoHistorico {
  nombre: string;
  fecha: string;
  movimientos: number;
}


@Component({
  selector: 'app-home',

  standalone: true,

  templateUrl: 'home.page.html',

  styleUrls: ['home.page.scss'],

  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonModal,
    IonInput,
    IonButton
  ],
})


export class HomePage implements OnInit {

  /*
    ==================================================
    DATOS DEL JUEGO
    ==================================================
  */

  imagenes: string[] = [];

  cartas: Carta[] = [];

  cargando = false;

  error = '';

  primeraCarta: Carta | null = null;

  segundaCarta: Carta | null = null;

  bloqueado = false;

  movimientos = 0;

  parejasEncontradas = 0;

  totalParejas = 8;


  /*
    ==================================================
    MEJOR RESULTADO
    ==================================================
  */

  mejorResultado: number | null = null;

  modalMejorMarcaAbierto = false;


  /*
    ==================================================
    USUARIO
    ==================================================
  */

  nombreJugador = '';

  nombreTemporal = '';

  modalRegistroAbierto = true;


  /*
    ==================================================
    HISTORIAL
    ==================================================
  */

  historialResultados: ResultadoHistorico[] = [];

  modalHistorialAbierto = false;


  /*
    ==================================================
    MODAL DE CONFIRMACIÓN PARA REINICIAR DATOS
    ==================================================
  */

  modalReinicioAbierto = false;


  constructor(
    private cdr: ChangeDetectorRef
  ) {}


  /*
    ==================================================
    INICIO
    ==================================================
  */

  async ngOnInit() {

    await this.cargarMejorResultado();

    await this.cargarHistorial();

    await this.cargarImagenes();

  }


  /*
    ==================================================
    MODAL - REGISTRO DEL JUGADOR
    ==================================================
  */

  registrarJugador() {

    const nombreLimpio =
      this.nombreTemporal.trim();


    if (!nombreLimpio) {
      return;
    }


    this.nombreJugador =
      nombreLimpio;


    this.modalRegistroAbierto =
      false;


    this.cdr.detectChanges();

  }


  abrirRegistroJugador() {

    this.nombreTemporal =
      this.nombreJugador;


    this.modalRegistroAbierto =
      true;


    this.cdr.detectChanges();

  }


  modalCerrado() {

    this.modalRegistroAbierto =
      false;

  }


  /*
    ==================================================
    MODAL - HISTORIAL
    ==================================================
  */

  abrirHistorial() {

    this.modalHistorialAbierto =
      true;


    this.cdr.detectChanges();

  }


  cerrarHistorial() {

    this.modalHistorialAbierto =
      false;


    this.cdr.detectChanges();

  }


  historialCerrado() {

    this.modalHistorialAbierto =
      false;

  }


  /*
    Mostramos primero las partidas
    más recientes.
  */

  get historialOrdenado(): ResultadoHistorico[] {

    return [
      ...this.historialResultados
    ].reverse();

  }


  /*
    ==================================================
    MODAL - NUEVA MEJOR MARCA
    ==================================================
  */

  cerrarModalMejorMarca() {

    this.modalMejorMarcaAbierto =
      false;


    this.cdr.detectChanges();

  }


  modalMejorMarcaCerrado() {

    this.modalMejorMarcaAbierto =
      false;

  }


  /*
    ==================================================
    MODAL - REINICIAR DATOS
    ==================================================
  */

  solicitarReinicioDatos() {

    /*
      Cerramos el historial.
    */

    this.modalHistorialAbierto =
      false;


    /*
      Después de la animación,
      mostramos el modal de confirmación.
    */

    setTimeout(() => {

      this.modalReinicioAbierto =
        true;


      this.cdr.detectChanges();

    }, 250);

  }


  cancelarReinicioDatos() {

    this.modalReinicioAbierto =
      false;


    /*
      Volvemos al historial.
    */

    setTimeout(() => {

      this.modalHistorialAbierto =
        true;


      this.cdr.detectChanges();

    }, 250);

  }


  modalReinicioCerrado() {

    this.modalReinicioAbierto =
      false;

  }


  /*
    ==================================================
    CONFIRMAR REINICIO
    ==================================================
  */

  async confirmarReinicioDatos() {

    try {

      /*
        Eliminamos el historial
        almacenado en Preferences.
      */

      await Preferences.remove({
        key: 'historialResultados'
      });


      /*
        Eliminamos también
        la mejor marca.
      */

      await Preferences.remove({
        key: 'mejorResultado'
      });


      /*
        Limpiamos los datos
        que están actualmente en memoria.
      */

      this.historialResultados = [];

      this.mejorResultado = null;


      /*
        Cerramos el modal.
      */

      this.modalReinicioAbierto =
        false;


      console.log(
        'Historial y mejor marca reiniciados'
      );


      this.cdr.detectChanges();

    } catch (error) {

      console.error(
        'Error reiniciando los datos:',
        error
      );

    }

  }


  /*
    ==================================================
    CARGAR MEJOR RESULTADO
    ==================================================
  */

  async cargarMejorResultado() {

    try {

      const resultado =
        await Preferences.get({
          key: 'mejorResultado'
        });


      if (resultado.value !== null) {

        this.mejorResultado =
          Number(resultado.value);

      }

    } catch (error) {

      console.error(
        'Error cargando mejor resultado:',
        error
      );

    }

  }


  /*
    ==================================================
    VERIFICAR MEJOR RESULTADO
    ==================================================
  */

  async verificarMejorResultado(): Promise<boolean> {

    const esNuevaMejorMarca =

      this.mejorResultado === null ||

      this.movimientos <
      this.mejorResultado;


    /*
      Si no mejoró el récord,
      devolvemos false.
    */

    if (!esNuevaMejorMarca) {

      return false;

    }


    /*
      Actualizamos el mejor resultado.
    */

    this.mejorResultado =
      this.movimientos;


    /*
      Lo guardamos permanentemente.
    */

    await Preferences.set({

      key: 'mejorResultado',

      value:
        this.movimientos.toString()

    });


    console.log(
      'Nueva mejor marca:',
      this.mejorResultado
    );


    return true;

  }


  /*
    ==================================================
    CARGAR HISTORIAL
    ==================================================
  */

  async cargarHistorial() {

    try {

      const resultado =
        await Preferences.get({

          key: 'historialResultados'

        });


      if (resultado.value !== null) {

        this.historialResultados =
          JSON.parse(
            resultado.value
          );

      }

    } catch (error) {

      console.error(
        'Error cargando historial:',
        error
      );


      this.historialResultados = [];

    }

  }


  /*
    ==================================================
    GUARDAR RESULTADO
    ==================================================
  */

  async guardarResultadoHistorico() {

    if (!this.nombreJugador.trim()) {
      return;
    }


    const nuevoResultado: ResultadoHistorico = {

      nombre:
        this.nombreJugador,

      fecha:
        new Date().toISOString(),

      movimientos:
        this.movimientos

    };


    this.historialResultados.push(
      nuevoResultado
    );


    await Preferences.set({

      key: 'historialResultados',

      value:
        JSON.stringify(
          this.historialResultados
        )

    });


    console.log(
      'Resultado guardado:',
      nuevoResultado
    );

  }


  /*
    ==================================================
    FINALIZAR PARTIDA
    ==================================================
  */

  async finalizarPartida() {

    /*
      Guardamos siempre la partida.
    */

    await this.guardarResultadoHistorico();


    /*
      Verificamos el récord.
    */

    const nuevaMejorMarca =
      await this.verificarMejorResultado();


    /*
      Solamente mostramos el modal
      cuando realmente se supera
      la mejor marca.
    */

    if (nuevaMejorMarca) {

      this.modalMejorMarcaAbierto =
        true;

    }


    this.cdr.detectChanges();

  }


  /*
    ==================================================
    CARGAR IMÁGENES
    ==================================================
  */

  async cargarImagenes() {

    this.cargando = true;

    this.error = '';

    this.cdr.detectChanges();


    try {

      const respuesta =
        await fetch(
          'https://dog.ceo/api/breeds/image/random/8'
        );


      if (!respuesta.ok) {

        throw new Error(
          'No fue posible consultar la API'
        );

      }


      const datos =
        await respuesta.json();


      if (datos.status !== 'success') {

        throw new Error(
          'La API respondió con un error'
        );

      }


      this.imagenes =
        datos.message;


      this.crearCartas();

    } catch (error) {

      console.error(
        'Error consultando Dog CEO API:',
        error
      );


      this.error =
        'No fue posible cargar las imágenes del juego.';

    } finally {

      this.cargando = false;

      this.cdr.detectChanges();

    }

  }


  /*
    ==================================================
    CREAR CARTAS
    ==================================================
  */

  crearCartas() {

    const cartasTemporales: Carta[] = [];


    this.imagenes.forEach(
      (imagen, indice) => {

        cartasTemporales.push({

          id:
            indice * 2,

          parejaId:
            indice,

          imagen:
            imagen,

          descubierta:
            false,

          encontrada:
            false

        });


        cartasTemporales.push({

          id:
            indice * 2 + 1,

          parejaId:
            indice,

          imagen:
            imagen,

          descubierta:
            false,

          encontrada:
            false

        });

      }
    );


    this.cartas =
      this.barajarCartas(
        cartasTemporales
      );

  }


  /*
    ==================================================
    BARAJAR CARTAS
    ==================================================
  */

  barajarCartas(
    cartas: Carta[]
  ): Carta[] {

    const cartasBarajadas =
      [...cartas];


    for (
      let i =
        cartasBarajadas.length - 1;

      i > 0;

      i--
    ) {

      const j =
        Math.floor(
          Math.random() * (i + 1)
        );


      [
        cartasBarajadas[i],
        cartasBarajadas[j]
      ] = [
        cartasBarajadas[j],
        cartasBarajadas[i]
      ];

    }


    return cartasBarajadas;

  }


  /*
    ==================================================
    VOLTEAR CARTA
    ==================================================
  */

  voltearCarta(
    carta: Carta
  ) {

    if (this.modalRegistroAbierto) {
      return;
    }


    if (this.modalMejorMarcaAbierto) {
      return;
    }


    if (this.modalReinicioAbierto) {
      return;
    }


    if (this.bloqueado) {
      return;
    }


    if (carta.encontrada) {
      return;
    }


    if (carta.descubierta) {
      return;
    }


    carta.descubierta =
      true;


    /*
      Primera carta.
    */

    if (
      this.primeraCarta === null
    ) {

      this.primeraCarta =
        carta;

      return;

    }


    /*
      Segunda carta.
    */

    this.segundaCarta =
      carta;


    this.movimientos++;


    this.compararCartas();

  }


  /*
    ==================================================
    COMPARAR CARTAS
    ==================================================
  */

  compararCartas() {

    if (
      this.primeraCarta === null ||
      this.segundaCarta === null
    ) {

      return;

    }


    this.bloqueado =
      true;


    const sonPareja =

      this.primeraCarta.parejaId ===
      this.segundaCarta.parejaId;


    if (sonPareja) {

      this.primeraCarta.encontrada =
        true;

      this.segundaCarta.encontrada =
        true;


      this.parejasEncontradas++;


      /*
        Partida terminada.
    */

      if (
        this.parejasEncontradas ===
        this.totalParejas
      ) {

        void this.finalizarPartida();

      }


      setTimeout(() => {

        this.reiniciarSeleccion();

        this.cdr.detectChanges();

      }, 400);


    } else {

      setTimeout(() => {

        if (this.primeraCarta) {

          this.primeraCarta.descubierta =
            false;

        }


        if (this.segundaCarta) {

          this.segundaCarta.descubierta =
            false;

        }


        this.reiniciarSeleccion();

        this.cdr.detectChanges();

      }, 1000);

    }

  }


  /*
    ==================================================
    REINICIAR SELECCIÓN
    ==================================================
  */

  reiniciarSeleccion() {

    this.primeraCarta =
      null;

    this.segundaCarta =
      null;

    this.bloqueado =
      false;

  }


  /*
    ==================================================
    NUEVO JUEGO
    ==================================================
  */

  async nuevoJuego() {

    this.bloqueado =
      true;


    this.primeraCarta =
      null;

    this.segundaCarta =
      null;


    this.movimientos =
      0;

    this.parejasEncontradas =
      0;


    /*
      NO eliminamos:
      - jugador
      - historial
      - mejor marca
    */

    this.imagenes =
      [];

    this.cartas =
      [];


    this.cdr.detectChanges();


    await this.cargarImagenes();


    this.bloqueado =
      false;


    this.cdr.detectChanges();

  }

}