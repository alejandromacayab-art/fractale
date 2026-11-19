"use client";
import { useEffect } from "react";

/** La interactividad que antes vivía en el <script> de index.html. */
export default function EfectosPortada() {
  useEffect(() => {
    const limpiezas: Array<() => void> = [];

    /* menú de móvil */
    const burger = document.getElementById("burger");
    const sheet = document.getElementById("sheet");
    if (burger && sheet) {
      const alTocar = () => {
        const abierto = sheet.classList.toggle("open");
        burger.setAttribute("aria-expanded", String(abierto));
        document.body.style.overflow = abierto ? "hidden" : "";
      };
      const alTocarEnlace = (e: Event) => {
        if ((e.target as HTMLElement).tagName === "A") alTocar();
      };
      burger.addEventListener("click", alTocar);
      sheet.addEventListener("click", alTocarEnlace);
      limpiezas.push(() => {
        burger.removeEventListener("click", alTocar);
        sheet.removeEventListener("click", alTocarEnlace);
        document.body.style.overflow = "";
      });
    }

    /* flechas del carrusel */
    const rail = document.getElementById("rail");
    document.querySelectorAll<HTMLElement>("[data-rail]").forEach((b) => {
      const mover = () => {
        const tarjeta = rail?.querySelector<HTMLElement>(".card");
        if (!rail || !tarjeta) return;
        const paso = tarjeta.offsetWidth + 20;
        rail.scrollBy({ left: b.dataset.rail === "next" ? paso : -paso, behavior: "smooth" });
      };
      b.addEventListener("click", mover);
      limpiezas.push(() => b.removeEventListener("click", mover));
    });

    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* la foto de portada se acerca al bajar */
    const foto = document.querySelector<HTMLElement>(".hero .portada div");
    if (!quieto && foto) {
      const acercar = () => {
        const k = Math.min(scrollY / 600, 1);
        foto.style.transform = "scale(" + (1 + k * 0.04) + ")";
      };
      addEventListener("scroll", acercar, { passive: true });
      limpiezas.push(() => removeEventListener("scroll", acercar));
    }

    /* cada bloque aparece al entrar en pantalla */
    if (!quieto && "IntersectionObserver" in window) {
      const candidatos = Array.from(
        document.querySelectorAll<HTMLElement>(
          "section:not(.hero) .wrap > *, section:not(.hero) .wide > *, .manifest > *, .allies article," +
            " .bento .b, .card, .galeria a, .tile, .pertenencia"
        )
      );
      candidatos.forEach((el, i) => {
        el.classList.add("rv");
        el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
      });
      const ojo = new IntersectionObserver(
        (filas) => {
          filas.forEach((f) => {
            if (f.isIntersecting) {
              f.target.classList.add("visto");
              ojo.unobserve(f.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px" }
      );
      candidatos.forEach((el) => ojo.observe(el));
      /* red de seguridad: pasados tres segundos se muestra todo */
      const reloj = setTimeout(() => candidatos.forEach((el) => el.classList.add("visto")), 3000);
      limpiezas.push(() => {
        ojo.disconnect();
        clearTimeout(reloj);
      });
    }

    /* la barra marca la sección en la que estás */
    const enlaces = Array.from(document.querySelectorAll<HTMLAnchorElement>('.links a[href^="#"]'));
    const destinos = enlaces.map((a) => document.querySelector<HTMLElement>(a.getAttribute("href")!));
    const marcar = () => {
      const y = scrollY + 140;
      let activo = -1;
      destinos.forEach((d, i) => {
        if (d && d.offsetTop <= y) activo = i;
      });
      enlaces.forEach((a, i) => a.classList.toggle("aqui", i === activo));
    };
    addEventListener("scroll", marcar, { passive: true });
    marcar();
    limpiezas.push(() => removeEventListener("scroll", marcar));

    return () => limpiezas.forEach((f) => f());
  }, []);

  return null;
}
