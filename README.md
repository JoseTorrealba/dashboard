# VisActor Next.js Dashboard Template

A modern dashboard template built with [VisActor](https://visactor.io/) and Next.js, featuring a beautiful UI and rich data visualization components.

[Live Demo](https://visactor-next-template.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=A%20modern%20dashboard%20with%20VisActor%20charts%2C%20dark%20mode%2C%20and%20data%20visualization%20for%20seamless%20analytics.&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F646TLqKGSTOnp1CD1IUqoM%2Fa119adac1f5a844f9d42f807ddc075f5%2Fthumbnail.png&demo-title=VisActor%20Next.js%20Template&demo-url=https%3A%2F%2Fvisactor-next-template.vercel.app%2F&from=templates&project-name=VisActor%20Next.js%20Template&repository-name=visactor-nextjs-template&repository-url=https%3A%2F%2Fgithub.com%2Fmengxi-ream%2Fvisactor-next-template&skippable-integrations=1)

## Features

- 📊 **Rich Visualizations** - Powered by VisActor, including bar charts, gauge charts, circle packing charts, and more
- 🌗 **Dark Mode** - Seamless dark/light mode switching with system preference support
- 📱 **Responsive Design** - Fully responsive layout that works on all devices
- 🎨 **Beautiful UI** - Modern and clean interface built with Tailwind CSS
- ⚡️ **Next.js 15** - Built on the latest Next.js features and best practices
- 🔄 **State Management** - Efficient state management with Jotai
- 📦 **Component Library** - Includes Shadcn components styled with Tailwind

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [VisActor](https://visactor.io/) - Visualization library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn](https://ui.shadcn.com/) - UI components
- [Jotai](https://jotai.org/) - State management
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Quick Start

You can deploy this template to Vercel by clicking the button above, or clone this repository and run it locally.

[Github Repo](https://github.com/mengxi-ream/visactor-next-template)

1. Clone this repository

```bash
git clone https://github.com/mengxi-ream/visactor-next-template
```

2. Install dependencies

```bash
pnpm install
```

3. Run the development server

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```bash
src/
├── app/ # App router pages
├── components/ # React components
│ ├── chart-blocks/ # Chart components
│ ├── nav/ # Navigation components
│ └── ui/ # UI components
├── config/ # Configuration files
├── data/ # Sample data
├── hooks/ # Custom hooks
├── lib/ # Utility functions
├── style/ # Global style
└── types/ # TypeScript types
```

## Charts

This template includes several chart examples:

- Average Tickets Created (Bar Chart)
- Ticket by Channels (Gauge Chart)
- Conversions (Circle Packing Chart)
- Customer Satisfaction (Linear Progress)
- Metrics Overview

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [VisActor](https://visactor.io/) - For the amazing visualization library
- [Vercel](https://vercel.com) - For the incredible deployment platform
- [Next.js](https://nextjs.org/) - For the awesome React framework





DELIMITER $$

DROP PROCEDURE IF EXISTS get_producto_por_codigo $$

CREATE PROCEDURE get_producto_por_codigo(IN p_codigo VARCHAR(50))
BEGIN
    DECLARE v_cod_art INT;

    -- Buscar por código de barras exacto (misma collation para evitar errores)
    SELECT cb.cod_art 
    INTO v_cod_art
    FROM codigosdebarra cb
    WHERE cb.cod_barra COLLATE latin1_swedish_ci = p_codigo COLLATE latin1_swedish_ci
    LIMIT 1;

    -- Si no se encontró, intenta tratarlo como código de producto numérico
    IF v_cod_art IS NULL THEN
        SET v_cod_art = CAST(p_codigo AS UNSIGNED);
    END IF;

    -- Retornar los campos específicos
    SELECT 
        p.COD_ART,
        p.descripcion,
        p.ultimo_costo,
        p.costo_compra,
        pr.IMPPRECIO_ANT1, pr.IMPPRECIO1,
        pr.FECHA_ACT_ANT, pr.FECHA_ACT
    FROM productos p
    JOIN precios pr ON pr.cod_art = p.cod_art AND pr.cod_empresa = p.cod_empresa
    WHERE p.cod_art = v_cod_art
      AND p.cod_empresa = 1
      AND pr.cod_lista = 1
    LIMIT 1;
END $$

DELIMITER ;
