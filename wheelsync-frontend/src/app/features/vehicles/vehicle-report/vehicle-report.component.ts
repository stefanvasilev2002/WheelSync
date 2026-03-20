import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { VehicleService } from '../../../core/services/vehicle.service';
import {
  VehicleReportResponse,
  ReportServiceRow,
  ReportFuelRow,
  ReportMileageRow,
  ReportDefectRow
} from '../../../core/models/report.model';

declare const window: Window & { jspdf: any };

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High'
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved'
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  OIL_CHANGE: 'Oil Change',
  TIRE_ROTATION: 'Tire Rotation',
  BRAKE_SERVICE: 'Brake Service',
  BATTERY_REPLACEMENT: 'Battery Replacement',
  AIR_FILTER: 'Air Filter',
  TRANSMISSION: 'Transmission',
  INSPECTION: 'Inspection',
  OTHER: 'Other'
};

@Component({
  selector: 'app-vehicle-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './vehicle-report.component.html',
  styleUrls: ['./vehicle-report.component.scss']
})
export class VehicleReportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly vehicleService = inject(VehicleService);

  report = signal<VehicleReportResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  serviceColumns = ['date', 'serviceType', 'mileage', 'cost', 'location'];
  fuelColumns = ['date', 'fuelType', 'quantity', 'pricePerLiter', 'totalPrice', 'mileage', 'consumption'];
  mileageColumns = ['date', 'driver', 'startMileage', 'endMileage', 'distance'];
  defectColumns = ['reportedAt', 'title', 'priority', 'status', 'resolutionNote'];

  readonly priorityLabels = PRIORITY_LABELS;
  readonly statusLabels = STATUS_LABELS;
  readonly serviceTypeLabels = SERVICE_TYPE_LABELS;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.vehicleService.getReport(id).subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load report.');
        this.loading.set(false);
      }
    });
  }

  exportPdf(): void {
    const r = this.report();
    if (!r) return;

    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 15;

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle Maintenance Report', pageWidth / 2, y, { align: 'center' });
        y += 10;

        // Vehicle info
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Vehicle: ${r.year} ${r.make} ${r.model}`, 14, y); y += 6;
        doc.text(`VIN: ${r.vin}  |  License Plate: ${r.licensePlate}`, 14, y); y += 6;
        if (r.assignedDriverName) {
          doc.text(`Assigned Driver: ${r.assignedDriverName}`, 14, y); y += 6;
        }
        doc.text(`Current Mileage: ${r.currentMileage.toLocaleString()} km`, 14, y); y += 6;
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y); y += 8;

        // Summary box
        doc.setFont('helvetica', 'bold');
        doc.text('Cost Summary', 14, y); y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        (doc as any).autoTable({
          startY: y,
          head: [['Category', 'Amount (MKD)']],
          body: [
            ['Service Cost', r.totalServiceCost.toLocaleString('mk-MK', { minimumFractionDigits: 2 })],
            ['Fuel Cost', r.totalFuelCost.toLocaleString('mk-MK', { minimumFractionDigits: 2 })],
            ['Total Cost', r.totalCost.toLocaleString('mk-MK', { minimumFractionDigits: 2 })],
            ['Total Distance', `${r.totalDistanceKm.toLocaleString()} km`]
          ],
          theme: 'striped',
          headStyles: { fillColor: [63, 81, 181] },
          margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        // Service Records
        if (r.services.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Service Records', 14, y); y += 4;
          (doc as any).autoTable({
            startY: y,
            head: [['Date', 'Type', 'Mileage', 'Cost (MKD)', 'Location']],
            body: r.services.map(s => [
              s.date,
              SERVICE_TYPE_LABELS[s.serviceType] ?? s.serviceType,
              `${s.mileage.toLocaleString()} km`,
              s.cost.toLocaleString('mk-MK', { minimumFractionDigits: 2 }),
              s.location ?? '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            margin: { left: 14, right: 14 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Fuel Logs
        if (r.fuelLogs.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Fuel Logs', 14, y); y += 4;
          (doc as any).autoTable({
            startY: y,
            head: [['Date', 'Type', 'Liters', 'Price/L', 'Total (MKD)', 'Mileage', 'Cons.']],
            body: r.fuelLogs.map(f => [
              f.date,
              f.fuelType,
              f.quantityLiters.toFixed(2),
              f.pricePerLiter.toFixed(2),
              f.totalPrice.toLocaleString('mk-MK', { minimumFractionDigits: 2 }),
              `${f.mileageAtRefuel.toLocaleString()} km`,
              f.consumption != null ? `${f.consumption.toFixed(2)} L/100` : '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            margin: { left: 14, right: 14 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Mileage Logs
        if (r.mileageLogs.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Mileage Logs', 14, y); y += 4;
          (doc as any).autoTable({
            startY: y,
            head: [['Date', 'Driver', 'Start', 'End', 'Distance']],
            body: r.mileageLogs.map(m => [
              m.date,
              m.driverName,
              `${m.startMileage.toLocaleString()} km`,
              `${m.endMileage.toLocaleString()} km`,
              `${m.distance.toLocaleString()} km`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            margin: { left: 14, right: 14 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Defects
        if (r.defects.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Defects', 14, y); y += 4;
          (doc as any).autoTable({
            startY: y,
            head: [['Reported', 'Title', 'Priority', 'Status', 'Resolution Note']],
            body: r.defects.map(d => [
              new Date(d.reportedAt).toLocaleDateString(),
              d.title,
              PRIORITY_LABELS[d.priority] ?? d.priority,
              STATUS_LABELS[d.status] ?? d.status,
              d.resolutionNote ?? '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            margin: { left: 14, right: 14 }
          });
        }

        doc.save(`vehicle-report-${r.licensePlate}-${new Date().toISOString().slice(0, 10)}.pdf`);
      });
    });
  }
}
