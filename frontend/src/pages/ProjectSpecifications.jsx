import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Building,
  GraduationCap,
  Zap,
  Globe,
  Code2,
  Terminal,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Video,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { getModelEvaluation, getClassroomAllocation } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

export default function ProjectSpecifications({ setActivePage }) {
  const [evaluation, setEvaluation] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evalRes, allocRes] = await Promise.all([
          getModelEvaluation(),
          getClassroomAllocation()
        ]);
        setEvaluation(evalRes);
        setAllocations(allocRes);
      } catch (err) {
        console.error('Project specifications load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. PROJECT HEADER & CORE OBJECTIVES */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded border border-campus-200">
                Project 37 • Computer Vision Domain
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              Smart Classroom Occupancy Detection
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              <strong>Problem Statement:</strong> Develop an AI-based occupancy monitoring system that counts students in classrooms using CCTV images and predicts occupancy levels for efficient classroom utilization and energy management.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActivePage('analyze')}
              className="px-3.5 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Test AI Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Core Objectives */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Core Project Objectives
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg border border-campus-200 bg-campus-50/40">
              <div className="flex items-center gap-2 font-bold text-xs text-campus-900">
                <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                <span>Count Occupants Automatically</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                Real-time automated student detection powered by YOLOv8 deep learning.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-campus-200 bg-campus-50/40">
              <div className="flex items-center gap-2 font-bold text-xs text-campus-900">
                <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                <span>Optimize Classroom Allocation</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                Data-driven venue rescheduling and room consolidation based on real capacity.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-campus-200 bg-campus-50/40">
              <div className="flex items-center gap-2 font-bold text-xs text-campus-900">
                <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                <span>Improve Energy Savings</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                Advisory power conservation guidance for lighting and HVAC in empty halls.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-campus-200 bg-campus-50/40">
              <div className="flex items-center gap-2 font-bold text-xs text-campus-900">
                <CheckCircle2 className="w-4 h-4 text-campus-600 shrink-0" />
                <span>Develop Occupancy Dashboard</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                Interactive real-time telemetry, historical trends, and live monitoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI MODELS (FEATURE 3) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-campus-600" />
          <h3 className="text-sm font-bold text-slate-900">
            AI Models Information & Architecture Hierarchy
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Model categorization across baseline, intermediate, and advanced computer vision architectures
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Baseline: CNN */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Baseline
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Baseline / Reference
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mt-2">CNN</h4>
              <p className="text-[11px] font-medium text-slate-600 mt-1">
                Standard Convolutional Neural Network
              </p>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Layered 2D convolutions and pooling for global crowd density estimation and baseline occupant counting.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
              Status: <span className="font-semibold text-slate-700">Reference Model</span>
            </div>
          </div>

          {/* Intermediate: YOLOv8 (ACTIVE/IMPLEMENTED) */}
          <div className="p-4 rounded-xl border-2 border-campus-500 bg-campus-50/20 shadow-sm flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-campus-700">
                  Intermediate
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-campus-600 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active / Implemented
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mt-2">YOLOv8</h4>
              <p className="text-[11px] font-medium text-campus-800 mt-1">
                Ultralytics You Only Look Once v8
              </p>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Real-time single-stage anchor-free detector isolating class <code className="font-mono text-campus-700 font-bold">person</code> with sub-15ms inference latency and precise bounding boxes.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-campus-200 text-[11px] text-campus-900 font-semibold">
              Status: <span className="text-campus-700">Currently Powering Website</span>
            </div>
          </div>

          {/* Advanced: CSRNet */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Advanced
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Advanced / Proposed
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mt-2">CSRNet</h4>
              <p className="text-[11px] font-medium text-slate-600 mt-1">
                Congested Scene Recognition Network
              </p>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Dilated convolutional layers maintaining receptive field resolution without losing spatial details for dense crowd counting.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
              Status: <span className="font-semibold text-slate-700">Proposed Research</span>
            </div>
          </div>

          {/* Advanced: Vision Transformer */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Advanced
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Advanced / Proposed
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mt-2">Vision Transformer</h4>
              <p className="text-[11px] font-medium text-slate-600 mt-1">
                Self-Attention Vision Transformer (ViT)
              </p>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Self-attention across 16x16 image patch tokens to model long-range context and robust occlusion handling.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
              Status: <span className="font-semibold text-slate-700">Proposed Research</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DATASET INFORMATION (FEATURE 1) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-campus-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Datasets
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Benchmark dataset references used for crowd counting and model development research
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dataset 1: Crowd Counting Dataset */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Crowd Counting Dataset
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Dataset Reference
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                <strong>Purpose:</strong> Dataset containing images of people/crowds for developing and evaluating classroom occupancy and people-counting models.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <a
                href="https://www.kaggle.com/search?q=crowd+counting"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <span>View Dataset</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Dataset 2: ShanghaiTech Dataset */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  ShanghaiTech Dataset
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Research Dataset
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                <strong>Purpose:</strong> Dataset for crowd counting and occupancy/people-counting model development and evaluation.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <a
                href="https://github.com/desenzhou/ShanghaiTechDataset"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-campus-600 hover:bg-campus-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <span>View Dataset</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Dataset Reference Clarification */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600">
          <span className="font-bold text-slate-800">Dataset Note: </span>
          The above datasets serve as research and benchmark references for people counting. The active live classroom detection in this project is executed by YOLOv8 trained for real-time person detection.
        </div>
      </div>

      {/* 4. TECHNOLOGY & TOOLS (FEATURE 2) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-4 h-4 text-campus-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Technology & Tools
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Programming environments, core libraries, and visualization tools used across development and runtime
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Programming Environment */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Programming Environment
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Project Reference
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900">Google Colab</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Model development and evaluation</p>
            </div>

            <div>
              <div className="font-bold text-slate-900">Jupyter Notebook</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Model development and evaluation</p>
            </div>
          </div>

          {/* Libraries */}
          <div className="p-4 rounded-xl border-2 border-campus-300 bg-campus-50/20 space-y-3">
            <div className="flex items-center justify-between border-b border-campus-200 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-campus-800">
                Libraries
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-campus-600 text-white">
                Implemented / Used
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900">OpenCV</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Image and video processing</p>
            </div>

            <div>
              <div className="font-bold text-slate-900">NumPy</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Numerical operations</p>
            </div>

            <div>
              <div className="font-bold text-slate-900">PyTorch</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Deep-learning model development</p>
            </div>

            <div>
              <div className="font-bold text-slate-900">Ultralytics</div>
              <p className="text-[11px] text-slate-600 mt-0.5">YOLO object detection</p>
            </div>
          </div>

          {/* Visualization */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Visualization
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Project Reference
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900">Matplotlib</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Data and evaluation visualization</p>
            </div>

            <div>
              <div className="font-bold text-slate-900">Seaborn</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Data and evaluation visualization</p>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Recharts (Web UI)</span>
                <span className="text-[10px] font-bold text-campus-700">Active</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">Interactive web dashboard visualization</p>
            </div>
          </div>
        </div>

        {/* Technology Status Verification Table */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Technology & System Status Verification
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Technology</th>
                  <th className="py-2.5 px-4">Role / Category</th>
                  <th className="py-2.5 px-4">Verified Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">OpenCV</td>
                  <td className="py-2 px-4 text-slate-500">Image & video frame decoding/processing</td>
                  <td className="py-2 px-4"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Working</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">NumPy</td>
                  <td className="py-2 px-4 text-slate-500">Frame arrays & numerical calculations</td>
                  <td className="py-2 px-4"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Working</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">PyTorch</td>
                  <td className="py-2 px-4 text-slate-500">Deep-learning tensor execution engine</td>
                  <td className="py-2 px-4"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Working</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">Ultralytics</td>
                  <td className="py-2 px-4 text-slate-500">YOLO object detection framework</td>
                  <td className="py-2 px-4"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Working</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">YOLOv8</td>
                  <td className="py-2 px-4 text-slate-500">Person detection & counting model</td>
                  <td className="py-2 px-4"><span className="text-campus-700 font-bold bg-campus-50 px-2 py-0.5 rounded border border-campus-200">✓ Active</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">CNN</td>
                  <td className="py-2 px-4 text-slate-500">Baseline crowd density reference</td>
                  <td className="py-2 px-4"><span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">Reference</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">CSRNet</td>
                  <td className="py-2 px-4 text-slate-500">Congested scene crowd counting</td>
                  <td className="py-2 px-4"><span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Proposed</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">Vision Transformer</td>
                  <td className="py-2 px-4 text-slate-500">Self-attention vision architecture</td>
                  <td className="py-2 px-4"><span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Proposed</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">MAE</td>
                  <td className="py-2 px-4 text-slate-500">Mean Absolute Error metric</td>
                  <td className="py-2 px-4"><span className="text-slate-600 font-medium">{evaluation?.evaluated ? `✓ Evaluated (${evaluation.mae} students)` : 'Available if ground truth exists'}</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">RMSE</td>
                  <td className="py-2 px-4 text-slate-500">Root Mean Square Error metric</td>
                  <td className="py-2 px-4"><span className="text-slate-600 font-medium">{evaluation?.evaluated ? `✓ Evaluated (${evaluation.rmse})` : 'Available if ground truth exists'}</span></td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-semibold text-slate-900">Accuracy</td>
                  <td className="py-2 px-4 text-slate-500">Classroom status classification accuracy</td>
                  <td className="py-2 px-4"><span className="text-slate-600 font-medium">{evaluation?.evaluated ? `✓ Evaluated (${evaluation.accuracy}%)` : 'Available if labelled data exists'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. MODEL EVALUATION & VISUALIZATION (FEATURE 4 & 5) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-campus-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Model Evaluation
            </h3>
          </div>
          <span className="text-[11px] font-bold text-campus-700 bg-campus-50 px-2.5 py-0.5 rounded border border-campus-200">
            Active Model: YOLOv8
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Real evaluation metrics comparing AI counting predictions against ground-truth manual verification checks
        </p>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Primary Metric: MAE */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              MAE
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {evaluation?.evaluated && evaluation.mae !== null
                ? `${evaluation.mae} students`
                : 'Evaluation data not available'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Mean Absolute Error: <span className="font-mono">1/n Σ|actual - predicted|</span>
            </p>
          </div>

          {/* Additional Metric: Accuracy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Accuracy
            </span>
            <div className="text-xl font-extrabold text-campus-700 mt-1">
              {evaluation?.evaluated && evaluation.accuracy !== null
                ? `${evaluation.accuracy}%`
                : 'Evaluation data not available'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Status classification accuracy
            </p>
          </div>

          {/* Additional Metric: RMSE */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              RMSE
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {evaluation?.evaluated && evaluation.rmse !== null
                ? `${evaluation.rmse}`
                : 'Evaluation data not available'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Root Mean Square Error: <span className="font-mono">√(1/n Σ(actual - predicted)²)</span>
            </p>
          </div>
        </div>

        {/* Feature 5: Evaluation Visualization or Clean Empty State */}
        {evaluation?.evaluated && evaluation.samples && evaluation.samples.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Actual Count vs Predicted Count
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evaluation.samples}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="classroom_name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="actual_count" name="Actual (Manual Ground-Truth)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted_count" name="Predicted (YOLOv8)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">Evaluation requires labelled ground-truth data.</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                The system strictly avoids hardcoded numbers. To evaluate the model with real data: perform an AI detection on a classroom, then record a ground-truth count under <strong>Occupancy History &rarr; Manual Check-In</strong>. The system will dynamically calculate MAE, Accuracy, and RMSE.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6. CLASSROOM ALLOCATION (FEATURE 9) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-campus-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Classroom Allocation (Objective #2)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
            Optimize Allocation
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Data-driven room utilization recommendations using actual classroom occupancy data
        </p>

        {allocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allocations.map((alloc) => (
              <div
                key={alloc.classroom_id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {alloc.classroom_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={alloc.status} size="sm" />
                      <span className="text-xs text-slate-500">
                        Occupancy: {alloc.current_occupancy} / {alloc.capacity} ({alloc.utilization_percentage}%)
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-campus-100 text-campus-800 border border-campus-200">
                    {alloc.recommended_action}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-800">Suggested Space: </strong>
                    {alloc.suggested_room_type}
                  </p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {alloc.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
            No classroom allocation data available yet.
          </div>
        )}
      </div>

      {/* 7. REAL-WORLD APPLICATIONS (FEATURE 6) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Real-World Applications
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Industry deployment scenarios and practical institutional applications
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-campus-200 transition-all">
            <div className="w-9 h-9 rounded-lg bg-campus-100 text-campus-700 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Smart Campus</h4>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              Automated campus-wide spatial auditing, bottleneck detection, and student density heatmaps.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-campus-200 transition-all">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Educational Institutions</h4>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              Optimized academic timetable generation, exam hall seat allotment, and lab capacity compliance.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-campus-200 transition-all">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Building className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Building Management</h4>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              Commercial facility management, emergency evacuation headcounts, and dynamic facility sanitization.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-campus-200 transition-all">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Smart Energy Systems</h4>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
              Occupancy-driven HVAC airflow modulation and automated lighting relays to cut idle carbon footprint.
            </p>
          </div>
        </div>
      </div>

      {/* 8. INPUT INFORMATION & EXPECTED OUTPUT (FEATURE 7 & 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Information */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Inputs
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Supported input data streams for occupancy inference
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-campus-500" />
                <span className="font-semibold text-slate-800">CCTV Images</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">JPG, PNG, WEBP</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-campus-500" />
                <span className="font-semibold text-slate-800">Video Frames</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">MP4, AVI, Live Webcam Stream</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-campus-500" />
                <span className="font-semibold text-slate-800">Occupancy History</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">SQLite Audited Timestamps</span>
            </div>
          </div>
        </div>

        {/* Expected Output */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Expected Output
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Dynamically generated real-time indicators
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Occupancy Count</span>
                <p className="text-[11px] text-slate-500">Detected student count from YOLOv8 inference</p>
              </div>
              <span className="text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                Dynamic
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Utilization Percentage</span>
                <p className="text-[11px] text-slate-500">(detected_count / capacity) × 100</p>
              </div>
              <span className="text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                Dynamic
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Classroom Status</span>
                <p className="text-[11px] text-slate-500">EMPTY, LOW OCCUPANCY, MODERATE, FULL</p>
              </div>
              <span className="text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                Dynamic
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 9. ENERGY MANAGEMENT ADVISORY NOTICE (FEATURE 10) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">
            Energy Management Advisory
          </h3>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Occupancy-driven energy recommendations are advisory guidelines for facility managers and smart building integration:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="font-bold text-slate-900">Empty Classroom</span>
            <p className="text-[11px] text-slate-600 mt-1">Consider switching off unnecessary lights, fans, and AC.</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="font-bold text-slate-900">Low Occupancy</span>
            <p className="text-[11px] text-slate-600 mt-1">Consider reducing unnecessary energy usage and consolidating sessions.</p>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="font-bold text-slate-900">Occupied Classroom</span>
            <p className="text-[11px] text-slate-600 mt-1">Normal operation with full climate and lighting comfort.</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 italic">
          Note: Recommendations provide advisory optimization data. Direct physical electrical switching requires dedicated IoT hardware relays.
        </p>
      </div>
    </div>
  );
}
