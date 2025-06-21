import { DataViewProps } from "@/app/types/data-info";

export default function DataView({ sections, title }: DataViewProps) {  return (
    <div className="max-w-xl  p-8 rounded-2xl shadow-lg">
    <h1 className="text-3xl font-bold mb-6">{title}</h1>
      {sections.map((section, i ) => (
        section.fields.length > 0?
        <div key={i}>
            <h2 className="text-xl font-semibold mt-4 mb-2">{section.name}</h2>
            {section.fields.map((field, j) => (
                // <div key={j} className="mb-1">
                //     <span className="font-semibold">{field.name}:</span> {field.value}
                // </div>
                field.value ?
                <p key={j}><span className="font-medium">{field.name}:</span> {field.value}</p>
                : ""
            ))}
        </div>
        : ""
      ))}
    </div>
  );
}

