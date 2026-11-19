import type { Metadata } from "next";
import Barra from "../barra";

export const metadata: Metadata = {
  title: "Términos y política de privacidad · FRACTALE",
  description: "Términos y condiciones de inscripción y política de privacidad de FRACTALE Sport Management.",
};

export default function Terminos() {
  return (
    <>
      <Barra />
      <main className="hoja">
        <p className="eyebrow mini">Legal</p>
        <h1 className="title">Términos y política de privacidad.</h1>
        <p className="lead">
          Borrador de referencia. Pendiente de revisión por un abogado antes de publicar.
        </p>

        <h2>1. Quiénes somos</h2>
        <p>
          FRACTALE Sport Management, con domicilio en Puerto Montt, Región de Los Lagos, Chile,
          es el responsable del tratamiento de los datos personales recogidos en este sitio.
          Contacto: <a href="mailto:Fractalechile@gmail.com">Fractalechile@gmail.com</a>.
        </p>

        <h2>2. Términos de inscripción</h2>
        <ul>
          <li>La inscripción es personal y no transferible, y queda confirmada al recibir el correo con el código QR.</li>
          <li>El participante declara estar en condiciones físicas adecuadas para la prueba en la que se inscribe.</li>
          <li>La organización puede modificar el trazado, el horario o las categorías por razones de seguridad o de fuerza mayor.</li>
          <li>El participante autoriza el uso de su imagen en fotografías y videos del evento con fines de difusión.</li>
          <li>Política de cambios, devoluciones y suspensión del evento: <b>por definir</b>.</li>
        </ul>

        <h2>3. Qué datos recogemos</h2>
        <p>
          Nombre, RUT, correo electrónico, teléfono, fecha de nacimiento, género, ciudad,
          club o equipo, categoría, talla de polera y contacto de emergencia. En el stand del evento
          registramos además qué actividades realizó el participante, asociadas a su inscripción.
        </p>

        <h2>4. Para qué los usamos</h2>
        <ul>
          <li>Gestionar la inscripción, la acreditación y la entrega del kit.</li>
          <li>Contactar al participante por asuntos del evento y, en caso de urgencia, a su contacto de emergencia.</li>
          <li>Elaborar estadísticas agregadas del evento y de las activaciones de marca.</li>
          <li>
            Enviar información, beneficios y novedades de FRACTALE y de las marcas auspiciadoras,
            solo con autorización expresa y con posibilidad de baja en cada correo.
          </li>
        </ul>

        <h2>5. Con quién los compartimos</h2>
        <p>
          Con los proveedores necesarios para operar el servicio (alojamiento del sitio, base de datos
          y envío de correos), que los tratan únicamente por cuenta de FRACTALE. No vendemos datos personales.
          Las marcas auspiciadoras reciben solo información agregada, salvo que el participante
          autorice expresamente otra cosa.
        </p>

        <h2>6. Cuánto tiempo los guardamos</h2>
        <p>
          Mientras sean necesarios para el evento y sus obligaciones legales, y después en forma
          agregada o anonimizada para estadísticas. <b>Plazo concreto por definir.</b>
        </p>

        <h2>7. Tus derechos</h2>
        <p>
          Conforme a la Ley 19.628 y a la Ley 21.719 sobre protección de datos personales, puedes
          solicitar acceso, rectificación, supresión, oposición y portabilidad de tus datos,
          y retirar tu consentimiento en cualquier momento, escribiendo a{" "}
          <a href="mailto:Fractalechile@gmail.com">Fractalechile@gmail.com</a>.
          Para dejar de recibir correos basta el enlace de baja incluido en cada envío.
        </p>

        <h2>8. Seguridad</h2>
        <p>
          Los datos se almacenan cifrados en tránsito y el acceso al panel de administración está
          restringido con contraseña a personal autorizado de FRACTALE.
        </p>

        <h2>9. Cambios en este documento</h2>
        <p>Publicaremos cualquier cambio en esta misma página, indicando la fecha de la última actualización.</p>

        <p className="nota-legal">Última actualización: noviembre de 2026. Documento preliminar.</p>
      </main>
    </>
  );
}
