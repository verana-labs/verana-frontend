export interface Field {
  name: string;
  value: string | null;
}

export interface Section {
  name: string;
  fields: Field[];
}

export interface DataViewProps {
  title: string;
  sections: Section[];
}
